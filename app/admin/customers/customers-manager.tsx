"use client"
import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Pencil, Save, X } from "lucide-react"
import { updateCustomerNickname } from "./actions"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface Customer {
  id: string
  phone: string
  name: string
  nickname: string | null
  created_at: string
  orders: { count: number }[]
}

interface CustomersManagerProps {
  customers: Customer[]
}

export function CustomersManager({ customers }: CustomersManagerProps) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [nickname, setNickname] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleEdit = (customer: Customer) => {
    setEditingId(customer.id)
    setNickname(customer.nickname || "")
  }

  const handleCancel = () => {
    setEditingId(null)
    setNickname("")
  }

  const handleSave = async (customerId: string) => {
    setIsSubmitting(true)
    try {
      await updateCustomerNickname(customerId, nickname)
      toast.success("Nickname updated", {
        description: "Customer nickname has been saved successfully",
      })
      setEditingId(null)
      router.refresh()
    } catch (error) {
      toast.error("Failed to update", {
        description: error instanceof Error ? error.message : "An error occurred",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const orderCount = (customer: Customer) => {
    return customer.orders?.[0]?.count || 0
  }

  return (
    <div className="space-y-4">
      <Card className="p-5 border border-gray-200 shadow-sm bg-white">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Customers</h2>
        <p className="text-sm text-gray-600">
          Assign nicknames to customers for easier identification when managing orders
        </p>
      </Card>

      {customers.length === 0 ? (
        <Card className="p-8 text-center border border-gray-200 bg-white">
          <p className="text-sm text-gray-600">No customers yet</p>
        </Card>
      ) : (
        customers.map((customer) => (
          <Card key={customer.id} className="p-5 border border-gray-200 hover:border-gray-300 bg-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-bold text-gray-900">{customer.name}</h3>
                  {editingId === customer.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="Enter nickname"
                        className="h-8 w-40 text-sm"
                        disabled={isSubmitting}
                      />
                      <Button
                        size="sm"
                        onClick={() => handleSave(customer.id)}
                        disabled={isSubmitting}
                        className="h-8 px-2 bg-teal-500 hover:bg-teal-600"
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCancel}
                        disabled={isSubmitting}
                        className="h-8 px-2"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      {customer.nickname && (
                        <span className="text-sm px-2.5 py-1 bg-teal-50 text-teal-700 border border-teal-300 rounded-md font-semibold">
                          {customer.nickname}
                        </span>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(customer)}
                        className="h-8 px-2 text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        {customer.nickname ? "Edit" : "Add Nickname"}
                      </Button>
                    </>
                  )}
                </div>
                <p className="text-sm text-gray-700 mb-1">📞 {customer.phone}</p>
                <p className="text-xs text-gray-500">{orderCount(customer)} orders placed</p>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  )
}
