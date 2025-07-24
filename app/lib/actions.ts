'use server';

import { z } from 'zod'
import postgres from 'postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string({
        invalid_type_error: 'Please select a customer',
    }),
    amount: z.coerce.number().gt(0, { message: 'Amount must be greater than $0' }),
    status: z.enum(['pending', 'paid', 'overdue'], {
        message: "Please select an invoice status.",
    }),
    date: z.string()
})

export type State = {
    errors?: {
        customerId?: string[];
        amount?: string[];
        status?: string[];
    };
    message?: string | null;
}

const CreateInvoice = FormSchema.omit({ id: true, date: true })


export async function createInvoice(prevState: State, formData: FormData) {
    const validatedFields  = CreateInvoice.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    })

    if(!validatedFields.success){
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Create Invoice.'   
        }
    }

    const {customerId, amount, status} = validatedFields.data;
    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];

    try {
        await sql`
        Insert into invoices (customer_id, amount, status, date) VALUES 
        (${customerId}, ${amountInCents}, ${status}, ${date})
        `;

    }
    catch (error) {
        console.error('Error creating invoice:', error);
        throw new Error('Failed to create invoice');
    }
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');

}

const UpdateInvoice = FormSchema.omit({ id: true, date: true })

export async function updateInvoice(id: string, formData: FormData) {
    const { customerId, amount, status } = UpdateInvoice.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    })

    const amountInCents = amount * 100;
    try {

        await sql`
    Update invoices set 
    customer_id = ${customerId},
    amount = ${amountInCents},
    status = ${status}
    where id = ${id}
    `;

    }
    catch (error) {
        console.error('Error updating invoice:', error);
        throw new Error('Failed to update invoice');
    }
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
    throw new Error('Failed to Delete Invoice');
    await sql`
    Delete from invoices where id=${id}`;
    revalidatePath('/dashboard/invoices');
}