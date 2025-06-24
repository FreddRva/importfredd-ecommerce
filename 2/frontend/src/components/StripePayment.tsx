'use client';

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

// Cargar Stripe (en producción, usar la clave pública real)
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_...');

interface StripePaymentProps {
  orderId: number;
  amount: number;
  currency: string;
  customerEmail: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
}

interface PaymentFormProps {
  orderId: number;
  amount: number;
  currency: string;
  customerEmail: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  orderId,
  amount,
  currency,
  customerEmail,
  onSuccess,
  onError,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      console.error('Stripe o Elements no están disponibles');
      return;
    }

    setIsProcessing(true);
    setMessage('');

    try {
      console.log('Iniciando confirmación de pago...');
      
      // Confirmar el pago
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
        redirect: 'if_required',
      });

      console.log('Respuesta de confirmPayment:', { error, paymentIntent });

      if (error) {
        console.error('Error de Stripe:', error);
        setMessage(error.message || 'Error procesando el pago');
        onError(error.message || 'Error procesando el pago');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('Pago exitoso:', paymentIntent);
        setMessage('¡Pago exitoso!');
        onSuccess(paymentIntent.id);
      } else {
        console.log('Estado del pago:', paymentIntent?.status);
        setMessage(`Estado del pago: ${paymentIntent?.status || 'desconocido'}`);
      }
    } catch (error) {
      console.error('Error inesperado:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error inesperado procesando el pago';
      setMessage(errorMessage);
      onError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Información de Pago</h3>
        <PaymentElement />
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('exitoso') 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isProcessing ? 'Procesando...' : `Pagar ${currency} ${(amount / 100).toFixed(2)}`}
      </button>
    </form>
  );
};

const StripePayment: React.FC<StripePaymentProps> = ({
  orderId,
  amount,
  currency,
  customerEmail,
  onSuccess,
  onError,
}) => {
  const [clientSecret, setClientSecret] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        console.log('Creando PaymentIntent con datos:', {
          amount,
          currency,
          order_id: orderId,
          customer_email: customerEmail,
        });

        const response = await fetch('http://localhost:8080/api/payments/create-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            amount,
            currency,
            order_id: orderId,
            customer_email: customerEmail,
            description: `Pago para pedido #${orderId}`,
          }),
        });

        console.log('Respuesta del servidor:', response.status, response.statusText);

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error del servidor:', errorData);
          throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('PaymentIntent creado:', data);
        setClientSecret(data.client_secret);
      } catch (err) {
        console.error('Error creando PaymentIntent:', err);
        const errorMessage = err instanceof Error ? err.message : 'Error inesperado';
        setError(errorMessage);
        onError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    createPaymentIntent();
  }, [orderId, amount, currency, customerEmail, onError]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Preparando pago...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-700">No se pudo inicializar el pago</p>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PaymentForm
        orderId={orderId}
        amount={amount}
        currency={currency}
        customerEmail={customerEmail}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  );
};

export default StripePayment; 