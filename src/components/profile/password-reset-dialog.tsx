"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff, Lock } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { request } from "@/lib/api-client"

// Validation schema
const passwordResetSchema = z.object({
    current_password: z.string().min(8, "Password must be at least 8 characters"),
    new_password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string().min(8, "Password must be at least 8 characters"),
}).refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
})

type PasswordResetFormValues = z.infer<typeof passwordResetSchema>

interface PasswordResetDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function PasswordResetDialog({
    open,
    onOpenChange,
}: PasswordResetDialogProps) {
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const router = useRouter()

    const form = useForm<PasswordResetFormValues>({
        resolver: zodResolver(passwordResetSchema),
        defaultValues: {
            current_password: "",
            new_password: "",
            confirm_password: "",
        },
    })

    async function onSubmit(data: PasswordResetFormValues) {
        try {
            // According to API spec, this endpoint requires JWT token in Authorization header
            // Try to get token from localStorage/sessionStorage, otherwise use cookies via request function
            const token =
                typeof window !== "undefined"
                    ? localStorage.getItem("wetruck_access_token") ||
                    localStorage.getItem("token") ||
                    sessionStorage.getItem("token") ||
                    localStorage.getItem("access_token") ||
                    sessionStorage.getItem("access_token")
                    : null

            const API_URL = process.env.NEXT_PUBLIC_API_URL || ""

            let result: { message: string } | undefined
            let error: string | undefined
            let status: number

            if (token) {
                // Use JWT token in Authorization header as per API spec
                const response = await fetch(`${API_URL}/auth/password-reset`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        current_password: data.current_password,
                        new_password: data.new_password,
                    }),
                })

                status = response.status
                const responseData = await response.json()

                if (!response.ok) {
                    error = responseData.detail || responseData.message || "Failed to reset password"
                } else {
                    result = responseData
                }
            } else {
                // Fallback to using request function (cookies) if no token found
                const response = await request<{ message: string }>(
                    "/auth/password-reset",
                    {
                        method: "POST",
                        body: JSON.stringify({
                            current_password: data.current_password,
                            new_password: data.new_password,
                        }),
                    }
                )
                result = response.data
                error = response.error
                status = response.status
            }

            if (error || status !== 200 || !result) {
                // Handle specific error cases
                if (status === 403) {
                    form.setError("current_password", {
                        type: "manual",
                        message: "Current password is incorrect",
                    })
                    return
                }

                if (status === 401) {
                    toast.error("Authentication Error", {
                        description: "Your session has expired. Please log in again.",
                    })
                    router.push("/sign-in")
                    return
                }

                // Handle validation errors
                if (status === 422) {
                    const errorMessage = error || "Validation error. Please check your input."
                    toast.error("Validation Error", {
                        description: errorMessage,
                    })
                    return
                }

                throw new Error(error || "Failed to reset password")
            }

            toast.success("Success", {
                description: result.message || "Password changed successfully",
            })

            // Reset form and close dialog
            form.reset()
            onOpenChange(false)
        } catch (error) {
            toast.error("Error", {
                description: error instanceof Error ? error.message : "Failed to reset password",
            })
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5" />
                        Change Password
                    </DialogTitle>
                    <DialogDescription>
                        Enter your current password and choose a new password.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="current_password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Current Password *</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                type={showCurrentPassword ? "text" : "password"}
                                                placeholder="Enter current password"
                                                {...field}
                                                className="pr-10"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            >
                                                {showCurrentPassword ? (
                                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                                ) : (
                                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                                )}
                                            </Button>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="new_password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>New Password *</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                type={showNewPassword ? "text" : "password"}
                                                placeholder="Enter new password"
                                                {...field}
                                                className="pr-10"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                            >
                                                {showNewPassword ? (
                                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                                ) : (
                                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                                )}
                                            </Button>
                                        </div>
                                    </FormControl>
                                    <p className="text-sm text-muted-foreground">
                                        Password must be at least 8 characters long.
                                    </p>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="confirm_password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirm New Password *</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                type={showConfirmPassword ? "text" : "password"}
                                                placeholder="Confirm new password"
                                                {...field}
                                                className="pr-10"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            >
                                                {showConfirmPassword ? (
                                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                                ) : (
                                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                                )}
                                            </Button>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    form.reset()
                                    onOpenChange(false)
                                }}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
