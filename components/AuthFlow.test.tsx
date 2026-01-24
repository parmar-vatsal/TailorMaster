import { render, screen, fireEvent } from '@testing-library/react';
import { AuthFlow } from '../components/AuthFlow';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect } from 'vitest';

// Mock DB
vi.mock('../services/db', () => ({
    db: {
        auth: {
            login: vi.fn(),
            register: vi.fn(),
        },
    },
}));

const renderWithRouter = (ui: React.ReactElement) => {
    return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('AuthFlow Component', () => {
    it('renders login form by default', () => {
        renderWithRouter(<AuthFlow mode="LOGIN" />);
        expect(screen.getByText('Welcome Back')).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/9876543210/)).toBeInTheDocument();
        expect(screen.getByText('Login')).toBeInTheDocument();
    });

    it('renders registration form', () => {
        renderWithRouter(<AuthFlow mode="REGISTER" />);
        expect(screen.getByText('Create Account')).toBeInTheDocument();
        expect(screen.getByText('Shop Name')).toBeInTheDocument();
    });
});
