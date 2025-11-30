"use client"
import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Pencil, Trash2, UserPlus, Phone, User, Tag, FileText } from "lucide-react"
import { updateCustomer, deleteCustomer, createCustomer } from "./actions"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface Customer {
  id: string
  phone: string
  name: string
  nickname: string | null
  notes: string | null
  created_at: string
  orders: { count: number }[]
}

interface CustomersManagerProps {
  customers: Customer[]
}

export function CustomersManager({ customers: initialCustomers }: CustomersManagerProps) {
  const router = useRouter()
  const [customers, setCustomers] = useState(initialCustomers)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    nickname: "",
    notes: "",
  })

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer)
    setFormData({
      name: customer.name,
      phone: customer.phone,
      nickname: customer.nickname || "",
      notes: customer.notes || "",
    })
    setIsEditDialogOpen(true)
  }

  const handleAdd = () => {
    setFormData({
      name: "",
      phone: "",
      nickname: "",
      notes: "",
    })
    setIsAddDialogOpen(true)
  }

  const handleDelete = (customer: Customer) => {
    setSelectedCustomer(customer)
    setIsDeleteDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedCustomer) return

    setIsSubmitting(true)
    const loadingToast = toast.loading("Updating customer...")

    try {
      await updateCustomer(selectedCustomer.id, formData)

      // Optimistic update
      setCustomers(customers.map((c) => (c.id === selectedCustomer.id ? { ...c, ...formData } : c)))

      toast.success("Customer updated", {
        description: "Customer information has been saved successfully",
        id: loadingToast,
      })
      setIsEditDialogOpen(false)
      router.refresh()
    } catch (error) {
      toast.error("Failed to update", {
        description: error instanceof Error ? error.message : "An error occurred",
        id: loadingToast,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveAdd = async () => {
    if (!formData.name || !formData.phone) {
      toast.error("Missing information", {
        description: "Name and phone number are required",
      })
      return
    }

    setIsSubmitting(true)
    const loadingToast = toast.loading("Adding customer...")

    try {
      const newCustomer = await createCustomer(formData)

      // Optimistic update
      setCustomers([newCustomer, ...customers])

      toast.success("Customer added", {
        description: "New customer has been added successfully",
        id: loadingToast,
      })
      setIsAddDialogOpen(false)
      router.refresh()
    } catch (error) {
      toast.error("Failed to add customer", {
        description: error instanceof Error ? error.message : "An error occurred",
        id: loadingToast,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const confirmDelete = async () => {
    if (!selectedCustomer) return

    setIsSubmitting(true)
    const loadingToast = toast.loading("Deleting customer...")

    try {
      await deleteCustomer(selectedCustomer.id)

      // Optimistic update
      setCustomers(customers.filter((c) => c.id !== selectedCustomer.id))

      toast.success("Customer deleted", {
        description: "Customer has been removed successfully",
        id: loadingToast,
      })
      setIsDeleteDialogOpen(false)
      router.refresh()
    } catch (error) {
      toast.error("Failed to delete", {
        description: error instanceof Error ? error.message : "An error occurred",
        id: loadingToast,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const orderCount = (customer: Customer) => {
    return customer.orders?.[0]?.count || 0
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 border-2 border-primary/20 shadow-lg bg-white rounded-3xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Customer Directory</h2>
            <p className="text-sm text-gray-600">Manage customer information, nicknames, and notes</p>
          </div>
          <Button
            onClick={handleAdd}
            className="bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl px-6 shadow-md"
          >
            <UserPlus className="h-5 w-5 mr-2" />
            Add Customer
          </Button>
        </div>
      </Card>

      {customers.length === 0 ? (
        <Card className="p-12 text-center border-2 border-dashed border-gray-300 bg-white rounded-3xl">
          <div className="max-w-sm mx-auto">
            <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-semibold text-gray-900 mb-2">No customers yet</p>
            <p className="text-sm text-gray-600 mb-6">
              Add your first customer to start tracking their orders and preferences
            </p>
            <Button
              onClick={handleAdd}
              className="bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl px-6"
            >
              <UserPlus className="h-5 w-5 mr-2" />
              Add Your First Customer
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {customers.map((customer) => (
            <Card
              key={customer.id}
              className="p-6 border-2 border-gray-200 hover:border-primary/40 transition-all bg-white rounded-3xl shadow-sm hover:shadow-md"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-xl font-bold text-gray-900">{customer.name}</h3>
                    {customer.nickname && (
                      <span className="text-sm px-3 py-1.5 bg-accent text-white border-2 border-accent rounded-full font-bold shadow-sm">
                        <Tag className="h-3 w-3 inline mr-1" />
                        {customer.nickname}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone className="h-4 w-4 text-primary" />
                    <span className="font-semibold">{customer.phone}</span>
                    <span className="text-sm text-gray-500 ml-4">
                      {orderCount(customer)} {orderCount(customer) === 1 ? "order" : "orders"} placed
                    </span>
                  </div>

                  {customer.notes && (
                    <div className="flex gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-200">
                      <FileText className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      <p className="flex-1">{customer.notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleEdit(customer)}
                    className="bg-primary/10 hover:bg-primary/20 text-primary font-bold rounded-xl px-4 border-2 border-primary/20"
                  >
                    <Pencil className="h-4 w-4 mr-1.5" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(customer)}
                    className="bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl px-4 border-2 border-red-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl border-2 border-primary/20">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Edit Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block">
                <User className="h-4 w-4 inline mr-1" />
                Customer Name *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                disabled={isSubmitting}
                className="rounded-xl border-2"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block">
                <Phone className="h-4 w-4 inline mr-1" />
                Phone Number *
              </label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1234567890"
                disabled={isSubmitting}
                className="rounded-xl border-2"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block">
                <Tag className="h-4 w-4 inline mr-1" />
                Nickname
              </label>
              <Input
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                placeholder="Regular Customer"
                disabled={isSubmitting}
                className="rounded-xl border-2"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block">
                <FileText className="h-4 w-4 inline mr-1" />
                Notes
              </label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any special notes about this customer..."
                disabled={isSubmitting}
                className="rounded-xl border-2 min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isSubmitting}
              className="rounded-xl border-2"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl border-2 border-primary/20">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Add New Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block">
                <User className="h-4 w-4 inline mr-1" />
                Customer Name *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                disabled={isSubmitting}
                className="rounded-xl border-2"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block">
                <Phone className="h-4 w-4 inline mr-1" />
                Phone Number *
              </label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1234567890"
                disabled={isSubmitting}
                className="rounded-xl border-2"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block">
                <Tag className="h-4 w-4 inline mr-1" />
                Nickname
              </label>
              <Input
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                placeholder="Regular Customer"
                disabled={isSubmitting}
                className="rounded-xl border-2"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block">
                <FileText className="h-4 w-4 inline mr-1" />
                Notes
              </label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any special notes about this customer..."
                disabled={isSubmitting}
                className="rounded-xl border-2 min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
              disabled={isSubmitting}
              className="rounded-xl border-2"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveAdd}
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl"
            >
              {isSubmitting ? "Adding..." : "Add Customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl border-2 border-red-200">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-red-600">Delete Customer</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700">
              Are you sure you want to delete <span className="font-bold">{selectedCustomer?.name}</span>? This action
              cannot be undone.
            </p>
            {selectedCustomer && orderCount(selectedCustomer) > 0 && (
              <p className="mt-3 text-sm text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-200">
                <strong>Warning:</strong> This customer has {orderCount(selectedCustomer)} order(s) in the system.
              </p>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isSubmitting}
              className="rounded-xl border-2"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl"
            >
              {isSubmitting ? "Deleting..." : "Delete Customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
