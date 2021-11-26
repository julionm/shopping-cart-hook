import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {

      let products: Product[] = [];
      let stocks: Stock[] = [];

      await api.get('/products').then(
        res => { products = res.data; }
      )

      await api.get('/stock').then(
        res => { stocks = res.data; }
      )

      const product = cart.find(cartProduct => cartProduct.id === productId);

      if (product) {

        const productStockInfo = stocks.find(stock => stock.id === productId);

        if (productStockInfo && (productStockInfo.amount >= (product.amount + 1))) {
          product.amount++;

          setCart([...cart]);

          localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
        } else {
          throw 'Quantidade solicitada fora de estoque';
        }

      } else {
        const newProduct = products.find(p => p.id === productId);
        const productStockInfo = stocks.find(stock => stock.id === productId);

        if (newProduct) {
          newProduct.amount = 0;
        } else {
          throw 'Quantidade solicitada fora de estoque';
        }

        if (productStockInfo && (productStockInfo.amount >= (newProduct.amount + 1))) {
          newProduct.amount += 1;
          const aux = [...cart, newProduct];

          setCart(aux);

          localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
        } else {
          throw 'Quantidade solicitada fora de estoque';
        }
      }

    } catch (e: any) {
      toast.error(e);
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productIndex = cart.findIndex(p => p.id === productId);
      const aux = [...cart];

      if (productIndex > -1) {
        aux.splice(productIndex, 1);
        setCart([...aux]);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
      } else {
        throw 'Product out of index';
      }
    } catch {
      toast.error('Erro na remoção do objeto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        return;
      }

      let stocks: Stock[] = [];

      await api.get('/stock').then(
        res => { stocks = res.data; }
      )

      const product = cart.find(p => p.id === productId);
      const productStockInfo = stocks.find(s => s.id === productId);

      if (product && productStockInfo) {
        if (productStockInfo.amount >= amount) {
          product.amount = amount;
          setCart([...cart]);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
        } else {
          throw 'Quantidade solicitada fora de estoque';
        }
      }

    } catch (e: any) {
      toast.error(e);
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
