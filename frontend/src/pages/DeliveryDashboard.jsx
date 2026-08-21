import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export const DeliveryDashboard = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDeliveries = async () => {
      try {
        setLoading(true);
        setError('');

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setError('Please log in as a delivery partner.');
          return;
        }

        const { data, error: deliveriesError } = await supabase
          .from('deliveries')
          .select(`
            id,
            order_id,
            partner_id,
            status,
            notes,
            created_at,
            updated_at
          `)
          .eq('partner_id', user.id)
          .order('created_at', { ascending: false });

        if (deliveriesError) {
          throw deliveriesError;
        }

        setDeliveries(data || []);
      } catch (err) {
        console.error('Failed to load deliveries:', err);
        setError(err.message || 'Failed to load deliveries.');
      } finally {
        setLoading(false);
      }
    };

    loadDeliveries();
  }, []);

  return (
    <div>
      <h1>Delivery Dashboard</h1>
      <p>Welcome to the FarmFresh Delivery Module.</p>

      <div>
        <h2>My Deliveries</h2>

        {loading && <p>Loading deliveries...</p>}

        {!loading && error && (
          <p>{error}</p>
        )}

        {!loading && !error && deliveries.length === 0 && (
          <p>No deliveries assigned yet.</p>
        )}

        {!loading && !error && deliveries.length > 0 && (
          <div>
            {deliveries.map((delivery) => (
              <div key={delivery.id}>
                <h3>Order: {delivery.order_id}</h3>
                <p>Status: {delivery.status}</p>
                <p>Notes: {delivery.notes || 'No notes'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};