'use server';

import { z } from 'zod'
import postgres from 'postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';

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
    const validatedFields = CreateInvoice.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    })

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Create Invoice.'
        }
    }

    const { customerId, amount, status } = validatedFields.data;
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
    const validatedFields = UpdateInvoice.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    })

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Create Invoice.'
        }
    }

    const { customerId, amount, status } = validatedFields.data;
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
    await sql`
    Delete from invoices where id=${id}`;
    revalidatePath('/dashboard/invoices');
}


export async function authenticate(prevState: string | undefined, formData: FormData) {
    console.log('Authenticating user...');
    try {
        const redirectTo = formData.get('redirectTo') as string || '/dashboard';
        
        await signIn('credentials', {
            email: formData.get('email'),
            password: formData.get('password'),
            redirectTo: redirectTo,
        });
        
        console.log('User authenticated successfully');
        
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Invalid credentials. Please try again.';
                default:
                    return 'An unexpected error occurred. Please try again later.';
            }
        }
        throw error;
    }
}