import React, { useState } from 'react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import axios from 'axios';

const stripePromise = loadStripe('YOUR_STRIPE_PUBLISHABLE_KEY');

const PaymentForm = ({ amount, orderId, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError('');

    try {
      const { data } = await axios.post('/payments/create-payment-intent', {
        amount,
        orderId
      });

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        data.clientSecret,
        { payment_method: { card: elements.getElement(CardElement) } }
      );

      if (stripeError) {
        setError(stripeError.message);
      } else if (paymentIntent.status === 'succeeded') {
        await axios.post('/payments/record', {
          order_id: orderId,
          amount,
          payment_method: 'Card',
          transaction_id: paymentIntent.id
        });
        onSuccess(paymentIntent.id);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">💳 Payment</h2>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Card Details
        </label>
        <div className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg">
          <CardElement />
        </div>
      </div>
      {error && <div className="text-red-600 text-sm mb-4">{error}</div>}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
      >
        {loading ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
      </button>
    </form>
  );
};

const Payment = ({ amount, orderId, onSuccess }) => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm amount={amount} orderId={orderId} onSuccess={onSuccess} />
    </Elements>
  );
};

export default Payment;

