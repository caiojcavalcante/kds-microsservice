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
    motoboy_phone
  } = body

  const updateData: any = {}
  if (customer_name !== undefined) updateData.customer_name = customer_name
  if (customer_phone !== undefined) updateData.customer_phone = customer_phone
  if (table_number !== undefined) updateData.table_number = table_number
  if (status !== undefined) updateData.status = status
  if (items !== undefined) updateData.items = items
  if (motoboy_name !== undefined) updateData.motoboy_name = motoboy_name
  if (motoboy_phone !== undefined) updateData.motoboy_phone = motoboy_phone

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
