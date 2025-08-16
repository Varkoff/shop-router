import { Outlet } from 'react-router';
import { Footer } from '~/components/layout/footer';
import { Navbar } from '~/components/layout/navbar';

export default function PublicLayout() {
    return (
        <>
            <Navbar />
            <div className='flex-1'>
                <Outlet />
            </div>
            <Footer />
        </>
    );
}
