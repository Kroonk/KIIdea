"use server"

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

function generateToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let token = ""
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}

export async function register(formData: FormData) {
  const username = (formData.get("username") as string)?.trim()
  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirmPassword") as string

  if (!username || !password) {
    return { error: "Benutzername und Passwort sind erforderlich." }
  }
  if (username.length < 3) {
    return { error: "Benutzername muss mindestens 3 Zeichen haben." }
  }
  if (password.length < 6) {
    return { error: "Passwort muss mindestens 6 Zeichen haben." }
  }
  if (password !== confirmPassword) {
    return { error: "Passwörter stimmen nicht überein." }
  }

  const existing = await prisma.user.findUnique({ where: { username } })
  if (existing) {
    return { error: "Benutzername ist bereits vergeben." }
  }

  // First user becomes admin
  const userCount = await prisma.user.count()
  const role = userCount === 0 ? "admin" : "user"

  const hash = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: { username, password: hash, role }
  })

  // Auto-login after registration
  const token = generateToken()
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

  await prisma.session.create({
    data: { token, userId: user.id, expiresAt }
  })

  const cookieStore = await cookies()
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  })

  redirect("/")
}

export async function login(formData: FormData) {
  const username = (formData.get("username") as string)?.trim()
  const password = formData.get("password") as string

  if (!username || !password) {
    return { error: "Benutzername und Passwort sind erforderlich." }
  }

  const user = await prisma.user.findUnique({ where: { username } })
  if (!user) {
    return { error: "Benutzername oder Passwort falsch." }
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    return { error: "Benutzername oder Passwort falsch." }
  }

  const token = generateToken()
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

  await prisma.session.create({
    data: { token, userId: user.id, expiresAt }
  })

  // Cleanup expired sessions
  await prisma.session.deleteMany({
    where: { expiresAt: { lt: new Date() } }
  })

  const cookieStore = await cookies()
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  })

  redirect("/")
}

export async function logout() {
  const cookieStore = await cookies()
  const token = cookieStore.get("session")?.value
  if (token) {
    await prisma.session.deleteMany({ where: { token } })
    cookieStore.delete("session")
  }
  redirect("/login")
}

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get("session")?.value
  if (!token) return null

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: { select: { id: true, username: true, role: true } } }
  })

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } })
    }
    return null
  }

  return session.user
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  return user
}

export async function requireAdmin() {
  const user = await requireAuth()
  if (user.role !== "admin") redirect("/")
  return user
}

// Admin: get all users
export async function getUsers() {
  return prisma.user.findMany({
    select: { id: true, username: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" }
  })
}

// Admin: delete user
export async function deleteUser(userId: string) {
  const admin = await requireAdmin()
  if (admin.id === userId) {
    return { error: "Du kannst dich nicht selbst löschen." }
  }
  await prisma.user.delete({ where: { id: userId } })
  revalidatePath("/admin")
  return { success: true }
}

// Admin: toggle user role
export async function toggleUserRole(userId: string) {
  const admin = await requireAdmin()
  if (admin.id === userId) {
    return { error: "Du kannst deine eigene Rolle nicht ändern." }
  }
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return { error: "Benutzer nicht gefunden." }

  await prisma.user.update({
    where: { id: userId },
    data: { role: user.role === "admin" ? "user" : "admin" }
  })
  revalidatePath("/admin")
  return { success: true }
}
