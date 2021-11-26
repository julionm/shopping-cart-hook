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
      const product: Product = (await api.get(`/products/${productId}`).catch(err => {
        throw 'Erro na adição do produto';
      })).data;
      const stockInfo = (await api.get(`/stock/${productId}`)).data;
      const cartAux = [...cart];

      if (product) {
        product.amount = 0;
        const cartProduct = cartAux.find(cartProduct => cartProduct.id === productId);

        if (cartProduct) {
          if ((cartProduct.amount + 1) > stockInfo.amount) {
            throw 'Quantidade solicitada fora de estoque';
          }

          cartProduct.amount++;
        } else {
          if ((product.amount + 1) > stockInfo.amount) {
            throw 'Quantidade solicitada fora de estoque';
          }

          product.amount++;
          cartAux.push(product);
        }

        setCart(cartAux);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartAux));
      } else {
        throw 'Erro na adição do produto';
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
        localStorage.setItem('@RocketShoes:cart', JSON.stringify([...aux]));
      } else {
        throw 'Product out of index';
      }
    } catch {
      toast.error('Erro na remoção do produto');
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

      const product = cart.find(p => p.id === productId);
       
      if (!product) {
        throw 'Erro na alteração de quantidade do produto';
      }

      const productStockInfo =  (await api.get(`/stock/${productId}`)).data;

      if (product && productStockInfo) {
        if (productStockInfo.amount >= amount) {
          product.amount = amount;
          setCart([...cart]);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
        } else {
          throw 'Quantidade solicitada fora de estoque';
        }
      } else {
        throw 'Erro na alteração de quantidade do produto';
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
