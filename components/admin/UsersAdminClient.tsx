// =============================================================================
// USERS ADMIN CLIENT - SGME
// =============================================================================
// Client component for managing users with delete functionality.
// =============================================================================

"use client"

import { useState } from "react"
import { Eye, Edit, Trash2, Search, Filter, UserPlus } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { toast } from "sonner"

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  role: "ADMIN" | "EMPLOYE" | "TECHNICIEN"
  isActive: boolean
  mustChangePassword: boolean
  createdAt: string
}

interface UsersAdminClientProps {
  initialUsers: User[]
}

export function UsersAdminClient({ initialUsers }: UsersAdminClientProps) {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete user "${name}"? This action cannot be undone.`)) {
      return
    }

    setDeletingId(id)
    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error || "Failed to delete user")
      }

      setUsers(users.filter((u) => u.id !== id))
      toast.success("User deleted successfully")
    } catch (error: any) {
      toast.error(error.message || "An error occurred while deleting the user")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Manage all users in the system</p>
        </div>
        <Link href="/dashboard/admin/users/create">
          <Button>
            <UserPlus className="w-4 h-4 mr-2" />
            Create User
          </Button>
        </Link>
      </div>

      {/* Search and filter */}
      <Card>
        <CardHeader>
          <CardTitle>Search Users</CardTitle>
          <CardDescription>Search by name, email or role</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input type="search" placeholder="Search..." className="pl-10" />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users table */}
      <Card>
        <CardHeader>
          <CardTitle>Users List</CardTitle>
          <CardDescription>{users.length} user(s) total</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium">User</th>
                  <th className="text-left py-3 px-4 font-medium">Email</th>
                  <th className="text-left py-3 px-4 font-medium">Role</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Password</th>
                  <th className="text-left py-3 px-4 font-medium">Created</th>
                  <th className="text-right py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {user.firstName[0]}{user.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{user.firstName} {user.lastName}</p>
                          <p className="text-sm text-muted-foreground">{user.phone || "No phone"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4"><p className="text-sm">{user.email}</p></td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === "ADMIN"
                          ? "bg-primary/10 text-primary"
                          : user.role === "EMPLOYE"
                          ? "bg-blue-500/10 text-blue-500"
                          : "bg-green-500/10 text-green-500"
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.isActive
                          ? "bg-green-500/10 text-green-500"
                          : "bg-destructive/10 text-destructive"
                      }`}>
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.mustChangePassword
                          ? "bg-yellow-500/10 text-yellow-500"
                          : "bg-green-500/10 text-green-500"
                      }`}>
                        {user.mustChangePassword ? "Change" : "OK"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/dashboard/admin/users/${user.id}`}>
                          <Button variant="ghost" size="icon">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Link href={`/dashboard/admin/users/${user.id}/edit`}>
                          <Button variant="ghost" size="icon">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(user.id, `${user.firstName} ${user.lastName}`)}
                          disabled={deletingId === user.id}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
