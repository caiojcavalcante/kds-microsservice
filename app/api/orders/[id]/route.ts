import { createServerClient } from "@/utils/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerClient()
  const body = await request.json()

  // Extract fields to update
  const {
    customer_name,
    customer_phone,
    table_number,
    status,
    items,
    motoboy_name,
    motoboy_phone,
    service_type,
    obs,
    payment,
    payment_status,
    billingType,
    total,
    delivered_by_id,
    delivered_by_name,
    delivered_at,
    copiaecola,
    encodedImage,
    invoiceUrl
  } = body

  const updateData: any = {}
  if (customer_name !== undefined) updateData.customer_name = customer_name
  if (customer_phone !== undefined) updateData.customer_phone = customer_phone
  if (table_number !== undefined) updateData.table_number = table_number
  if (status !== undefined) updateData.status = status
  if (items !== undefined) updateData.items = items
  if (motoboy_name !== undefined) updateData.motoboy_name = motoboy_name
  if (motoboy_phone !== undefined) updateData.motoboy_phone = motoboy_phone
  if (service_type !== undefined) updateData.service_type = service_type
  if (obs !== undefined) updateData.obs = obs
  if (payment !== undefined) updateData.payment = payment
  if (payment_status !== undefined) updateData.payment_status = payment_status
  if (billingType !== undefined) updateData.billingType = billingType
  if (total !== undefined) updateData.total = total
  if (delivered_by_id !== undefined) updateData.delivered_by_id = delivered_by_id
  if (delivered_by_name !== undefined) updateData.delivered_by_name = delivered_by_name
  if (delivered_at !== undefined) updateData.delivered_at = delivered_at
  if (copiaecola !== undefined) updateData.copiaecola = copiaecola
  if (encodedImage !== undefined) updateData.encodedImage = encodedImage
  if (invoiceUrl !== undefined) updateData.invoiceUrl = invoiceUrl

  updateData.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from("orders")
    .update(updateData)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerClient()

  const { error } = await supabase
    .from("orders")
    .delete()
    .eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
