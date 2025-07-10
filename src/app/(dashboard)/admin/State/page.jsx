'use client';

import { useState, useEffect } from 'react';

export default function StatePage() {
  const [states, setStates] = useState([]);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [country, setCountry] = useState('');
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // Error handling

  // Fetch the list of countries for selecting
  const fetchCountries = async () => {
    try {
      const res = await fetch('/api/countries'); // Assuming you have a countries endpoint
      const data = await res.json();
      setCountries(data);
    } catch (error) {
      console.error('Error fetching countries:', error.message);
    }
  };

  const fetchStates = async (countryCode) => {
    if (!countryCode) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/states?country=${countryCode}`);
      if (!res.ok) {
        throw new Error('Failed to fetch states');
      }
      const data = await res.json();
      setStates(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching states:', error.message);
      setError('Failed to load states.');
      setStates([]); // Set an empty array on error
    } finally {
      setLoading(false);
    }
  };

  const addState = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/states', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, code, country }),
      });
      if (!res.ok) {
        throw new Error('Failed to add state');
      }
      setName('');
      setCode('');
      fetchStates(country); // Re-fetch states after adding
    } catch (error) {
      console.error('Error adding state:', error.message);
      setError('Failed to add state.');
    }
  };

  const deleteState = async (id) => {
    try {
      const res = await fetch(`/api/states?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        throw new Error('Failed to delete state');
      }
      fetchStates(country); // Re-fetch states after deletion
    } catch (error) {
      console.error('Error deleting state:', error.message);
      setError('Failed to delete state.');
    }
  };

  useEffect(() => {
    fetchCountries();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">State Master</h1>

      {/* Error message */}
      {error && <div className="text-red-500 mb-4">{error}</div>}

      <div className="mb-6">
        <select
          onChange={(e) => {
            setCountry(e.target.value);
            fetchStates(e.target.value);
          }}
          value={country}
          className="border px-4 py-2 mr-2"
        >
          <option value="">Select a Country</option>
          {countries.map((countryItem) => (
            <option key={countryItem._id} value={countryItem.code}>
              {countryItem.name}
            </option>
          ))}
        </select>
      </div>

      {country && (
        <>
          <form onSubmit={addState} className="mb-6">
            <input
              type="text"
              placeholder="State Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border px-4 py-2 mr-2"
              required
            />
            <input
              type="text"
              placeholder="State Code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="border px-4 py-2 mr-2"
              required
            />
            <button type="submit" className="bg-blue-500 text-white px-4 py-2">
              Add State
            </button>
          </form>

          {/* Loading state */}
          {loading ? (
            <div className="mb-4">Loading states...</div>
          ) : (
            <ul>
              {states.length > 0 ? (
                states.map((state) => (
                  <li key={state._id} className="flex justify-between items-center border-b py-2">
                    <span>
                      {state.name} ({state.code})
                    </span>
                    <button
                      onClick={() => deleteState(state._id)}
                      className="bg-red-500 text-white px-2 py-1"
                    >
                      Delete
                    </button>
                  </li>
                ))
              ) : (
                <li>No states found</li>
              )}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
