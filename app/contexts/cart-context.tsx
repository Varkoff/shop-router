import { createContext, useContext } from 'react'
import { useCart } from '~/hooks/use-cart'

type CartContextType = ReturnType<typeof useCart>

const CartContext = createContext<CartContextType | undefined>(undefined)

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
    const cartActions = useCart()

    return (
        <CartContext.Provider value={cartActions}>
            {children}
        </CartContext.Provider>
    )
}

export const useCartContext = () => {
    const context = useContext(CartContext)
    if (context === undefined) {
        throw new Error('useCartContext must be used within a CartProvider')
    }
    return context
}


