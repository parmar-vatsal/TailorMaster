import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from './db';
import { supabase } from './supabase';

// Mock Supabase
vi.mock('./supabase', () => ({
    supabase: {
        auth: {
            getSession: vi.fn(),
            signInWithOtp: vi.fn(),
            signOut: vi.fn(),
        },
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    maybeSingle: vi.fn(),
                    order: vi.fn(),
                })),
                order: vi.fn(),
            })),
            insert: vi.fn(() => ({
                select: vi.fn(() => ({
                    single: vi.fn()
                }))
            })),
            update: vi.fn(() => ({
                eq: vi.fn()
            })),
            upsert: vi.fn(() => ({
                select: vi.fn(() => ({
                    single: vi.fn()
                }))
            })),
            delete: vi.fn(() => ({
                eq: vi.fn()
            }))
        })),
    },
}));

describe('db service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('auth.getSession', () => {
        it('returns null if no session', async () => {
            vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: null }, error: null } as any);
            const user = await db.auth.getSession();
            expect(user).toBeNull();
        });

        it('returns default profile if row missing', async () => {
            vi.mocked(supabase.auth.getSession).mockResolvedValue({
                data: { session: { user: { id: '123', email: 'test@example.com' } } },
                error: null,
            } as any);

            // Mock empty profile response
            const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
            const eq = vi.fn().mockReturnValue({ maybeSingle });
            const select = vi.fn().mockReturnValue({ eq });
            vi.mocked(supabase.from).mockReturnValue({ select } as any);

            const user = await db.auth.getSession();
            expect(user).toMatchObject({
                id: '123',
                shopName: 'My Tailor Shop',
                email: 'test@example.com',
                pin: '0000',
                isAuthenticated: true
            });
        });
    });
});
