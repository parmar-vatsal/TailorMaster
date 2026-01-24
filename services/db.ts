import { supabase } from './supabase';
import { Customer, Measurement, Order, AppConfig, Profile, GarmentType, Expense, Design, OrderStatus, OrderItem, AuthUser } from '../types';

// --- DATABASE INTERFACES (Raw SQL) ---

interface DBProfile {
    id: string;
    shop_name: string;
    mobile: string | null;
    email: string | null;
    address: string | null;
    gst_in: string | null;
    logo_url: string | null;
    pin: string | null;
    created_at: string;
    updated_at: string;
}

interface DBCustomer {
    id: string;
    profile_id: string;
    name: string;
    mobile: string;
    address: string | null;
    notes: string | null;
    created_at: string;
}

interface DBMeasurement {
    id: string;
    profile_id: string;
    customer_id: string;
    garment_type: string;
    values: Record<string, any>;
    notes: string | null;
    updated_at: string;
}

interface DBOrder {
    id: string;
    profile_id: string;
    customer_id: string;
    status: string;
    delivery_date: string;
    total_amount: number;
    advance_amount: number;
    notes: string | null;
    created_at: string;
}

interface DBOrderItem {
    id: string;
    order_id: string;
    garment_type: string;
    qty: number;
    price: number;
    measurement_snapshot: Record<string, any> | null;
    created_at: string;
}

interface DBExpense {
    id: string;
    profile_id: string;
    category: string;
    amount: number;
    note: string | null;
    date: string;
    created_at: string;
}

interface DBDesign {
    id: string;
    profile_id: string;
    title: string;
    category: string;
    image_url: string;
    created_at: string;
}

// --- MAPPERS ---

const parseDate = (val: string | number): number => {
    if (!val) return Date.now();
    if (typeof val === 'number') return val;
    return new Date(val).getTime();
};

const mapProfile = (p: DBProfile): Profile => ({
    id: p.id,
    shopName: p.shop_name || 'My Shop',
    mobile: p.mobile || undefined,
    email: p.email || undefined,
    address: p.address || undefined,
    gstIn: p.gst_in || undefined,
    logoUrl: p.logo_url || undefined,
    pin: p.pin || '0000',
    createdAt: parseDate(p.created_at)
});

const mapCustomer = (c: DBCustomer): Customer => ({
    id: c.id,
    profileId: c.profile_id,
    name: c.name,
    mobile: c.mobile,
    address: c.address || undefined,
    notes: c.notes || undefined,
    createdAt: parseDate(c.created_at)
});

const mapMeasurement = (m: DBMeasurement): Measurement => ({
    id: m.id,
    profileId: m.profile_id,
    customerId: m.customer_id,
    garmentType: m.garment_type as GarmentType,
    values: m.values,
    notes: m.notes || undefined,
    updatedAt: parseDate(m.updated_at)
});

const mapOrder = (o: DBOrder, items: DBOrderItem[] = []): Order => ({
    id: o.id,
    profileId: o.profile_id,
    customerId: o.customer_id,
    status: o.status as OrderStatus,
    deliveryDate: o.delivery_date,
    totalAmount: o.total_amount,
    advanceAmount: o.advance_amount,
    notes: o.notes || undefined,
    createdAt: parseDate(o.created_at),
    items: items.map(mapOrderItem)
});

const mapOrderItem = (i: DBOrderItem): OrderItem => ({
    id: i.id,
    orderId: i.order_id,
    garmentType: i.garment_type as GarmentType,
    qty: i.qty,
    price: i.price,
    measurementSnapshot: i.measurement_snapshot || undefined
});

const mapExpense = (e: DBExpense): Expense => ({
    id: e.id,
    profileId: e.profile_id,
    category: e.category,
    amount: e.amount,
    note: e.note || undefined,
    date: e.date,
    createdAt: parseDate(e.created_at)
});

const mapDesign = (d: DBDesign): Design => ({
    id: d.id,
    profileId: d.profile_id,
    title: d.title,
    category: d.category,
    imageUrl: d.image_url,
    createdAt: parseDate(d.created_at)
});

// --- SERVICE IMPLEMENTATION ---

export const db = {
    auth: {
        getSession: async (): Promise<AuthUser | null> => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return null;

            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .maybeSingle();

                if (!data) {
                    // Profile creation is handled by trigger, but if it lags:
                    const fallback: Profile = {
                        id: session.user.id,
                        shopName: 'My Tailor Shop',
                        email: session.user.email,
                        pin: '0000',
                        createdAt: Date.now()
                    };
                    return { ...fallback, isAuthenticated: true };
                }
                return { ...mapProfile(data), isAuthenticated: true };
            } catch (err) {
                console.error("Session error:", err);
                return null;
            }
        },

        signIn: async (identifier: string, password?: string) => {
            if (password) {
                // Determine if email or phone
                const isEmail = identifier.includes('@');
                if (isEmail) {
                    return supabase.auth.signInWithPassword({ email: identifier, password });
                } else {
                    // Mobile login isn't directly supported by signInWithPassword unless we use a custom solution or 3rd party provider.
                    // However, Supabase DOES support phone auth if configured. 
                    // Let's assume we use phone + password if our backend supports it, OR we are mapping phone to email in a cloud function.
                    // For now, let's just stick to email-based login for simplicity unless user has phone auth set up.
                    // If we want to support Phone + Password, we usually need a custom RPC or Edge Function if Supabase native phone auth is OTP only.
                    // But Supabase CAN allow phone + password if we set the phone as the identity.
                    // Actually, Supabase Phone Auth is typically OTP. 
                    // BUT, we can support "Sign in with Phone + Password" only if we treat the Phone as a custom claim or mapped to Email.
                    // Let's assume for this project we are using Email for auth primarily, and Mobile is just profile data.
                    // We will just error if they try to use phone for now.
                    // Reverting to prior behavior:
                    throw new Error("Please use Email to login.");
                }
            }
            return supabase.auth.signInWithOtp({ email: identifier });
        },

        signUp: async (data: { email: string, password: string, shopName: string, mobile: string, pin: string, logoUrl?: string }) => {
            return supabase.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    data: {
                        shop_name: data.shopName,
                        mobile: data.mobile,
                        pin: data.pin,
                        logo_url: data.logoUrl
                    }
                }
            });
        },

        signOut: async () => {
            return supabase.auth.signOut();
        },

        resetPassword: async (email: string) => {
            // Redirect to the reset-password route
            return supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });
        },

        updateUser: async (attributes: { password?: string }) => {
            return supabase.auth.updateUser(attributes);
        }
    },

    config: {
        get: async (): Promise<AppConfig> => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return { shopName: 'My Shop', pin: '0000' };

            const { data } = await supabase.from('profiles').select('shop_name, pin, logo_url').eq('id', session.user.id).maybeSingle();
            return data ? { shopName: data.shop_name, pin: data.pin || '0000', logo: data.logo_url } : { shopName: 'My Shop', pin: '0000' };
        },
        update: async (updates: Partial<Profile>) => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const payload: any = {};
            if (updates.shopName) payload.shop_name = updates.shopName;
            if (updates.pin) payload.pin = updates.pin;
            if (updates.logoUrl) payload.logo_url = updates.logoUrl;

            await supabase.from('profiles').update(payload).eq('id', session.user.id);
        }
    },

    customers: {
        list: async (): Promise<Customer[]> => {
            const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            return data ? data.map(mapCustomer) : [];
        },
        get: async (id: string): Promise<Customer | null> => {
            const { data } = await supabase.from('customers').select('*').eq('id', id).maybeSingle();
            return data ? mapCustomer(data) : null;
        },
        save: async (customer: Partial<Customer> & { name: string, mobile: string }) => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("No session");

            const payload: any = {
                profile_id: session.user.id,
                name: customer.name,
                mobile: customer.mobile,
                address: customer.address,
                notes: customer.notes
            };

            if (customer.id) payload.id = customer.id;

            const { data, error } = await supabase.from('customers').upsert(payload).select().single();
            if (error) throw error;
            return mapCustomer(data);
        },
        delete: async (id: string) => {
            return supabase.from('customers').delete().eq('id', id);
        },
        findByMobile: async (mobile: string): Promise<Customer | null> => {
            const { data } = await supabase.from('customers').select('*').eq('mobile', mobile).maybeSingle();
            return data ? mapCustomer(data) : null;
        }
    },

    measurements: {
        getForCustomer: async (customerId: string): Promise<Measurement[]> => {
            const { data } = await supabase.from('measurements').select('*').eq('customer_id', customerId);
            return data ? data.map(mapMeasurement) : [];
        },
        save: async (m: Partial<Measurement> & { customerId: string, garmentType: GarmentType, values: Record<string, string> }) => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("No session");

            const payload: any = {
                profile_id: session.user.id,
                customer_id: m.customerId,
                garment_type: m.garmentType,
                values: m.values,
                notes: m.notes
            };

            // Upsert based on composite key (customer_id, garment_type) constraint in DB
            const { data, error } = await supabase.from('measurements').upsert(payload, { onConflict: 'customer_id, garment_type' }).select().single();
            if (error) throw error;
            return mapMeasurement(data);
        }
    },

    orders: {
        list: async (): Promise<Order[]> => {
            // Join order_items to display garment types in list
            const { data } = await supabase
                .from('orders')
                .select('*, order_items(*)')
                .order('created_at', { ascending: false });

            if (!data) return [];

            // Mapper needs update to handle the joined structure if it differs or map manually
            return data.map((o: any) => mapOrder(o, o.order_items));
        },
        get: async (id: string): Promise<Order | null> => {
            // Fetch order and items
            const { data: orderData } = await supabase.from('orders').select('*').eq('id', id).maybeSingle();
            if (!orderData) return null;

            const { data: itemsData } = await supabase.from('order_items').select('*').eq('order_id', id);

            return mapOrder(orderData, itemsData || []);
        },
        create: async (order: { customerId: string, deliveryDate: string, items: { garmentType: GarmentType, price: number, qty: number }[], advance: number }) => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("No session");

            const total = order.items.reduce((sum, item) => sum + (item.price * item.qty), 0);

            // 1. Create Order
            const { data: orderData, error: orderError } = await supabase.from('orders').insert({
                profile_id: session.user.id,
                customer_id: order.customerId,
                delivery_date: order.deliveryDate,
                total_amount: total,
                advance_amount: order.advance,
                status: OrderStatus.RECEIVED
            }).select().single();

            if (orderError || !orderData) throw orderError || new Error("Failed to create order");

            // 2. Create Items
            const itemsPayload = order.items.map(item => ({
                order_id: orderData.id,
                garment_type: item.garmentType,
                qty: item.qty,
                price: item.price
                // We could capture measurement snapshot here if needed
            }));

            const { error: itemsError } = await supabase.from('order_items').insert(itemsPayload);
            if (itemsError) throw itemsError;

            return orderData.id;
        },
        updateStatus: async (id: string, status: OrderStatus) => {
            return supabase.from('orders').update({ status }).eq('id', id);
        },
        delete: async (id: string) => {
            return supabase.from('orders').delete().eq('id', id);
        }
    },

    expenses: {
        list: async (): Promise<Expense[]> => {
            const { data } = await supabase.from('expenses').select('*').order('date', { ascending: false });
            return data ? data.map(mapExpense) : [];
        },
        save: async (ex: Partial<Expense> & { category: string, amount: number }) => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("No session");

            const payload: any = {
                profile_id: session.user.id,
                category: ex.category,
                amount: ex.amount,
                note: ex.note,
                date: ex.date || new Date().toISOString().split('T')[0]
            };
            if (ex.id) payload.id = ex.id;

            const { data, error } = await supabase.from('expenses').upsert(payload).select().single();
            if (error) throw error;
            return mapExpense(data);
        },
        delete: async (id: string) => {
            return supabase.from('expenses').delete().eq('id', id);
        }
    },

    designs: {
        list: async (): Promise<Design[]> => {
            const { data } = await supabase.from('designs').select('*').order('created_at', { ascending: false });
            return data ? data.map(mapDesign) : [];
        },
        upload: async (design: { file: File, category: string, title: string }) => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("No session");

            // 1. Upload Image
            const fileExt = design.file.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `${session.user.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage.from('designs').upload(filePath, design.file);
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('designs').getPublicUrl(filePath);

            // 2. Save Metadata
            const { data, error } = await supabase.from('designs').insert({
                profile_id: session.user.id,
                title: design.title,
                category: design.category,
                image_url: publicUrl
            }).select().single();

            if (error) throw error;
            return mapDesign(data);
        },
        delete: async (id: string) => {
            // Ideally delete from storage too, but for now just DB record
            // To delete from storage we'd need to parse the URL to get the path
            return supabase.from('designs').delete().eq('id', id);
        }
    },

    storage: {
        findExistingInvoice: async (dateStr: string, orderId: string) => {
            try {
                const { data, error } = await supabase.storage.from('invoices').list(dateStr, {
                    search: `${orderId}.pdf`
                });
                if (error || !data || data.length === 0) return null;
                return `${dateStr}/${orderId}.pdf`;
            } catch (e) {
                console.error("Storage lookup failed", e);
                return null;
            }
        },
        uploadInvoice: async (blob: Blob, path: string) => {
            return supabase.storage.from('invoices').upload(path, blob, { upsert: true });
        },
        getPublicUrl: (path: string) => {
            return supabase.storage.from('invoices').getPublicUrl(path).data.publicUrl;
        }
    }
};
