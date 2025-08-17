import { Outlet } from 'react-router';
import { Footer } from '~/components/layout/footer';
import { Navbar } from '~/components/layout/navbar';
import { CartProvider } from '~/contexts/cart-context';

export default function PublicLayout() {
    return (
        <CartProvider>
            <Navbar />
            <div className='flex-1'>
                <Outlet />
            </div>
            <Footer />
        </CartProvider>
    );
}
