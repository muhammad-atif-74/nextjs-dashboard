'use server';

import { z } from 'zod'
import postgres from 'postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const sql = postgres("postgres://neondb_owner:npg_6GcrsDAPBvn3@ep-sweet-heart-ad2tjr70-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require", { ssl: 'require' });

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(),
    status: z.enum(['pending', 'paid', 'overdue']),
    date: z.string()
})

const CreateInvoice = FormSchema.omit({ id: true, date: true })


export async function createInvoice(formData: FormData) {
    const { customerId, amount, status } = CreateInvoice.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    })
    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];

    await sql`
    Insert into invoices (customer_id, amount, status, date) VALUES 
    (${customerId}, ${amountInCents}, ${status}, ${date})
    `;

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');

}

const UpdateInvoice = FormSchema.omit({ id: true, date: true })

export async function updateInvoice(id: string, formData: FormData) {
    const {customerId, amount, status} = UpdateInvoice.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    })

    const amountInCents = amount * 100; 
    
    await sql`
    Update invoices set 
    customer_id = ${customerId},
    amount = ${amountInCents},
    status = ${status}
    where id = ${id}
    `;

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string){
    await sql`
    Delete from invoices where id=${id}`;
    revalidatePath('/dashboard/invoices');
}