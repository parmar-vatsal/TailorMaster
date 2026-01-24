import { createBrowserRouter } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { GlobalLayout } from '../components/GlobalLayout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Dashboard } from '../components/Dashboard';
import { OrderCreation } from '../components/OrderCreation';
import { OrderList } from '../components/OrderList';
import { InvoiceView } from '../components/InvoiceView';
import { CustomerList } from '../components/CustomerList';
import { Reports } from '../components/Reports';
import { Settings } from '../components/Settings';
import { ExpenseTracker } from '../components/ExpenseTracker';
import { DesignCatalog } from '../components/DesignCatalog';
import { LandingPage } from '../components/LandingPage';
import { AuthFlow } from '../components/AuthFlow';
import { Auth } from '../components/Auth';
import { ResetPassword } from '../components/ResetPassword';

export const router = createBrowserRouter([
    {
        element: <GlobalLayout />,
        children: [
            {
                path: '/',
                element: <LandingPage />,
            },
            {
                path: '/login',
                element: <AuthFlow mode="LOGIN" />,
            },
            {
                path: '/register',
                element: <AuthFlow mode="REGISTER" />,
            },
            {
                path: '/unlock',
                element: <Auth />,
            },
            {
                path: '/reset-password',
                element: <ResetPassword />,
            },
            {
                element: (
                    <ProtectedRoute>
                        <Layout />
                    </ProtectedRoute>
                ),
                children: [
                    {
                        path: '/dashboard',
                        element: <Dashboard />,
                    },
                    {
                        path: '/orders/new',
                        element: <OrderCreation />,
                    },
                    {
                        path: '/orders',
                        element: <OrderList />,
                    },
                    {
                        path: '/orders/:id',
                        element: <InvoiceViewWrapper />,
                    },
                    {
                        path: '/customers',
                        element: <CustomerList />,
                    },
                    {
                        path: '/reports',
                        element: <Reports />,
                    },
                    {
                        path: '/expenses',
                        element: <ExpenseTracker />,
                    },
                    {
                        path: '/catalog',
                        element: <DesignCatalog />,
                    },
                    {
                        path: '/settings',
                        element: <Settings />,
                    },
                ],
            },
        ]
    }
]);

// Wrapper to extract params for InvoiceView
import { useParams } from 'react-router-dom';
function InvoiceViewWrapper() {
    const { id } = useParams<{ id: string }>();
    if (!id) return null;
    return <InvoiceView orderId={id} />;
}
