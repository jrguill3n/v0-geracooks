"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Trash2 } from "lucide-react"
import { deleteOrder } from "./actions"
import { useToast } from "@/hooks/use-toast"

interface DeleteOrderButtonProps {
  orderId: string
  customerName: string
  onDeleteStart?: () => void
}

export function DeleteOrderButton({ orderId, customerName, onDeleteStart }: DeleteOrderButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleDelete = async () => {
    console.log("[v0] Delete button clicked for order:", orderId)
    setIsDeleting(true)

    if (onDeleteStart) {
      onDeleteStart()
    }

    try {
      const result = await deleteOrder(orderId)
      console.log("[v0] Delete result:", result)

      if (result.success) {
        toast({
          title: "Order deleted",
          description: `Order from ${customerName} has been removed.`,
          duration: 3000,
        })

        setIsOpen(false)

        setTimeout(() => {
          router.refresh()
        }, 300)
      } else {
        toast({
          title: "Failed to delete order",
          description: result.error || "An unknown error occurred",
          variant: "destructive",
          duration: 5000,
        })
        setIsDeleting(false)
      }
    } catch (error) {
      console.error("[v0] Delete error:", error)
      toast({
        title: "Failed to delete order",
        description: "An unexpected error occurred",
        variant: "destructive",
        duration: 5000,
      })
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="h-9 px-3 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-400"
      >
        <Trash2 className="h-4 w-4 mr-1" />
        Delete
      </Button>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the order from <span className="font-semibold">{customerName}</span>. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? "Deleting..." : "Delete Order"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
