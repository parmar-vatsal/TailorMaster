
import { supabase } from './supabase';
import { Customer, Measurement, Order, AppConfig, User, GarmentType, Expense, Design } from '../types';

// --- HELPERS ---

const sanitizeMobile = (val: any) => {
    if (!val) return '';
    return String(val).replace(/\D/g, '').trim();
};

const generateDummyEmail = (mobile: string) => {
    const clean = sanitizeMobile(mobile);
    return `u${clean}@tailor.local`; 
};

// Safe date parser
const parseDate = (val: string | number): number => {
    if (!val) return Date.now();
    if (typeof val === 'number') return val;
    if (/^\d+$/.test(val)) return parseInt(val, 10);
    return new Date(val).getTime();
};

const mapUser = (u: any, authEmail?: string): User => ({
  id: u.id,
  name: u.name || 'Master',
  shopName: u.shop_name || 'My Shop',
  mobile: u.mobile,
  email: u.email || authEmail, 
  password: '', // We no longer store password hashes in public table for security
  pin: u.pin || '0000',
  logo: u.logo,
  createdAt: parseDate(u.created_at)
});

const mapCustomer = (c: any): Customer => ({
  id: c.id,
  name: c.name,
  mobile: c.mobile,
  address: c.address,
  createdAt: parseDate(c.created_at)
});

const mapMeasurement = (m: any): Measurement => ({
  id: m.id,
  customerId: m.customer_id,
  garmentType: m.garment_type as GarmentType,
  data: m.data,
  updatedAt: parseDate(m.updated_at)
});

const mapOrder = (o: any): Order => ({
    id: o.id, 
    customerId: o.customer_id, 
    measurementId: o.measurement_id, 
    garmentType: o.garment_type,
    deliveryDate: o.delivery_date, 
    totalAmount: o.total_amount, 
    advanceAmount: o.advance_amount, 
    status: o.status, 
    createdAt: parseDate(o.created_at)
});

const mapExpense = (e: any): Expense => ({
    id: e.id,
    category: e.category,
    amount: e.amount,
    note: e.note,
    date: e.date,
    createdAt: parseDate(e.created_at)
});

const mapDesign = (d: any): Design => ({
    id: d.id,
    title: d.title,
    category: d.category,
    imageUrl: d.image_url,
    createdAt: parseDate(d.created_at)
});

const getCurrentUserId = async (): Promise<string | null> => {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.id || null;
};

// --- DB SERVICE ---

export const db = {
  auth: {
    checkSession: async (): Promise<User | null> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null;
      
      try {
          // Fetch profile
          const { data, error } = await supabase.from('users').select('*').eq('id', session.user.id).maybeSingle();
          
          if (!data) {
             // Fallback if trigger hasn't fired yet (rare)
             return {
                 id: session.user.id,
                 name: 'Master',
                 shopName: 'My Tailor Shop',
                 mobile: '',
                 email: session.user.email,
                 password: '',
                 pin: '0000',
                 createdAt: Date.now()
             };
          }
          return mapUser(data, session.user.email);
      } catch (err) {
          console.error("Session check failed:", err);
          return null;
      }
    },
    
    login: async (identifier: string, password: string): Promise<{ success: boolean, user?: User, message?: string }> => {
      const cleanIdentifier = identifier.trim().toLowerCase();
      const isEmail = cleanIdentifier.includes('@');
      const cleanMobile = sanitizeMobile(cleanIdentifier);
      
      // Determine email to use
      let emailToUse = cleanIdentifier;
      if (!isEmail) {
          emailToUse = generateDummyEmail(cleanMobile);
      }

      try {
          // 1. Supabase Auth
          const { data, error } = await supabase.auth.signInWithPassword({
              email: emailToUse,
              password: password
          });

          if (error) {
             console.error("Auth Error:", error);
             if (error.message.includes('Email not confirmed')) {
                if (!isEmail) {
                    return { success: false, message: 'CONFIGURATION ERROR: Please disable "Confirm Email" in your Supabase Dashboard.' };
                }
                return { success: false, message: 'Please verify your email address before logging in.' };
             }
             return { success: false, message: 'Invalid Mobile/Email or Password.' };
          }

          if (data.user) {
              // 2. Fetch Profile
              const { data: profile } = await supabase.from('users').select('*').eq('id', data.user.id).maybeSingle();
              
              if (!profile) {
                  // Fallback if trigger is slow
                  return { 
                      success: true, 
                      user: {
                        id: data.user.id,
                        name: 'Tailor',
                        shopName: 'My Shop',
                        mobile: isEmail ? '' : cleanMobile,
                        email: emailToUse,
                        password: '',
                        pin: '0000',
                        createdAt: Date.now()
                      } 
                  };
              }
              return { success: true, user: mapUser(profile, data.user.email) };
          }
          
          return { success: false, message: 'Login failed unexpectedly.' };

      } catch (err: any) {
          return { success: false, message: err.message || 'Login failed' };
      }
    },

    register: async (user: Omit<User, 'id' | 'createdAt'>): Promise<{ success: boolean, message?: string }> => {
      const cleanMobile = sanitizeMobile(user.mobile);
      let emailToRegister = user.email ? user.email.trim().toLowerCase() : '';
      const isDummyEmail = !emailToRegister;
      
      if (isDummyEmail) {
          emailToRegister = generateDummyEmail(cleanMobile);
      }

      try {
          const { data: authData, error: authError } = await supabase.auth.signUp({
              email: emailToRegister,
              password: user.password,
              options: { 
                  data: { 
                      name: user.name, 
                      shop_name: user.shopName, 
                      mobile: cleanMobile,
                      pin: user.pin 
                  } 
              }
          });

          if (authError) throw authError;
          if (!authData.user) throw new Error("Registration failed");

          // CRITICAL FIX:
          // We immediately try to check if we have a session.
          // If we DO NOT have a session, it means Supabase is waiting for email confirmation.
          // Since we are using dummy emails for mobile login, this is a blocker.
          
          if (!authData.session) {
              if (isDummyEmail) {
                  return { success: false, message: 'CONFIGURATION ERROR: Go to Supabase Dashboard -> Auth -> Providers -> Email -> Disable "Confirm Email".' };
              }
              return { success: false, message: 'Account created! Please check your email to confirm.' };
          }
          
          return { success: true };

      } catch (err: any) {
          let msg = err.message || "Registration failed";
          if (msg.includes('already registered')) msg = 'This mobile number is already registered. Please Login.';
          return { success: false, message: msg };
      }
    },

    logout: async () => {
      await supabase.auth.signOut();
    },

    getCurrentUser: async (): Promise<User | null> => {
        const userId = await getCurrentUserId();
        if (!userId) return null;
        const { data: { session } } = await supabase.auth.getSession();
        const { data } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
        return data ? mapUser(data, session?.user?.email) : null;
    }
  },

  config: {
    get: async (): Promise<AppConfig> => {
       const userId = await getCurrentUserId();
       if (!userId) return { shopName: 'My Shop', pin: '0000' };
       const { data } = await supabase.from('users').select('shop_name, pin, logo').eq('id', userId).maybeSingle();
       return data ? { shopName: data.shop_name, pin: data.pin, logo: data.logo } : { shopName: 'My Shop', pin: '0000' };
    },
    set: async (config: AppConfig) => {
      const userId = await getCurrentUserId();
      if (!userId) return;
      await supabase.from('users').update({ shop_name: config.shopName, pin: config.pin, logo: config.logo }).eq('id', userId);
    }
  },

  customers: {
    getAll: async (): Promise<Customer[]> => {
      const userId = await getCurrentUserId();
      if (!userId) return [];
      const { data } = await supabase.from('customers').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      return data ? data.map(mapCustomer) : [];
    },
    getByMobile: async (mobile: string): Promise<Customer | undefined> => {
      const userId = await getCurrentUserId();
      if (!userId) return undefined;
      const { data } = await supabase.from('customers').select('*').eq('user_id', userId).eq('mobile', mobile).maybeSingle();
      return data ? mapCustomer(data) : undefined;
    },
    save: async (customer: Customer) => {
       const userId = await getCurrentUserId();
       if (!userId) throw new Error("Not authenticated");
       const payload = { id: customer.id, user_id: userId, name: customer.name, mobile: customer.mobile, address: customer.address, created_at: customer.createdAt };
       const { error } = await supabase.from('customers').upsert(payload);
       if (error) throw error;
    },
    getById: async (id: string): Promise<Customer | undefined> => {
        const { data } = await supabase.from('customers').select('*').eq('id', id).maybeSingle();
        return data ? mapCustomer(data) : undefined;
    },
    delete: async (id: string) => {
        const { error: oErr } = await supabase.from('orders').delete().eq('customer_id', id);
        if (oErr) console.error(oErr);
        const { error: mErr } = await supabase.from('measurements').delete().eq('customer_id', id);
        if (mErr) console.error(mErr);
        const { error } = await supabase.from('customers').delete().eq('id', id);
        return { error };
    }
  },

  measurements: {
    getAll: async (): Promise<Measurement[]> => {
      const userId = await getCurrentUserId();
      if (!userId) return [];
      const { data } = await supabase.from('measurements').select('*, customers!inner(user_id)').eq('customers.user_id', userId);
      return data ? data.map(mapMeasurement) : [];
    },
    getByCustomerAndType: async (customerId: string, type: GarmentType): Promise<Measurement | undefined> => {
      const { data } = await supabase.from('measurements').select('*').eq('customer_id', customerId).eq('garment_type', type).maybeSingle();
      return data ? mapMeasurement(data) : undefined;
    },
    save: async (measurement: Measurement) => {
        await supabase.from('measurements').upsert({ 
            id: measurement.id, 
            customer_id: measurement.customerId, 
            garment_type: measurement.garmentType, 
            data: measurement.data, 
            updated_at: measurement.updatedAt 
        });
    },
    getById: async (id: string): Promise<Measurement | undefined> => {
         const { data } = await supabase.from('measurements').select('*').eq('id', id).maybeSingle();
         return data ? mapMeasurement(data) : undefined;
    }
  },

  orders: {
    getAll: async (): Promise<Order[]> => {
       const userId = await getCurrentUserId();
       if (!userId) return [];
       const { data } = await supabase.from('orders').select('*, customers!inner(user_id)').eq('customers.user_id', userId);
       return data ? data.map(mapOrder) : [];
    },
    save: async (order: Order) => {
       const payload = { 
           id: order.id, 
           customer_id: order.customerId, 
           measurement_id: order.measurementId, 
           garment_type: order.garmentType, 
           delivery_date: order.deliveryDate, 
           total_amount: order.totalAmount, 
           advance_amount: order.advanceAmount, 
           status: order.status, 
           created_at: order.createdAt
       };
       const { error } = await supabase.from('orders').upsert(payload);
       if (error) throw error;
    },
    getById: async (id: string): Promise<Order | undefined> => {
        const { data } = await supabase.from('orders').select('*').eq('id', id).maybeSingle();
        return data ? mapOrder(data) : undefined;
    },
    delete: async (id: string) => {
        const { error } = await supabase.from('orders').delete().eq('id', id);
        return { error };
    }
  },

  expenses: {
      getAll: async (): Promise<Expense[]> => {
          const userId = await getCurrentUserId();
          if (!userId) return [];
          const { data } = await supabase.from('expenses').select('*').eq('user_id', userId).order('date', { ascending: false });
          return data ? data.map(mapExpense) : [];
      },
      save: async (expense: Expense) => {
          const userId = await getCurrentUserId();
          if (!userId) throw new Error("Not authenticated");
          const payload = {
              id: expense.id,
              user_id: userId,
              category: expense.category,
              amount: expense.amount,
              note: expense.note,
              date: expense.date,
              created_at: expense.createdAt
          };
          const { error } = await supabase.from('expenses').upsert(payload);
          if (error) throw error;
      },
      delete: async (id: string) => {
          const { error } = await supabase.from('expenses').delete().eq('id', id);
          return { error };
      }
  },

  designs: {
      getAll: async (): Promise<Design[]> => {
          const userId = await getCurrentUserId();
          if (!userId) return [];
          const { data } = await supabase.from('designs').select('*').eq('user_id', userId).order('created_at', { ascending: false });
          return data ? data.map(mapDesign) : [];
      },
      upload: async (file: File, category: string, title: string): Promise<Design> => {
          const userId = await getCurrentUserId();
          if (!userId) throw new Error("Not authenticated");
          
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}.${fileExt}`;
          const filePath = `${userId}/${fileName}`;

          const { error: uploadError } = await supabase.storage.from('catalog').upload(filePath, file);
          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage.from('catalog').getPublicUrl(filePath);

          const newDesign: Design = {
              id: crypto.randomUUID(),
              title,
              category,
              imageUrl: publicUrl,
              createdAt: Date.now()
          };

          const payload = {
              id: newDesign.id,
              user_id: userId,
              title: newDesign.title,
              category: newDesign.category,
              image_url: newDesign.imageUrl,
              created_at: newDesign.createdAt
          };

          const { error: dbError } = await supabase.from('designs').insert(payload);
          if (dbError) throw dbError;

          return newDesign;
      },
      delete: async (id: string, imageUrl: string) => {
          const pathParts = imageUrl.split('/catalog/');
          if (pathParts.length > 1) {
              const path = pathParts[1];
              await supabase.storage.from('catalog').remove([path]);
          }
          const { error } = await supabase.from('designs').delete().eq('id', id);
          return { error };
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
        const { data, error } = await supabase.storage.from('invoices').upload(path, blob, {
            contentType: 'application/pdf',
            upsert: true
        });
        return { data, error };
    },
    getPublicUrl: (path: string) => {
        const { data } = supabase.storage.from('invoices').getPublicUrl(path);
        return data.publicUrl;
    }
  }
};
