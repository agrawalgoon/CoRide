import React, { useState, useEffect } from 'react';
import { Car, Plus, Trash2, Edit } from 'lucide-react';
import api from '../../services/api';

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await api.get('/vehicles');
        setVehicles(response.data);
      } catch (err) {
        // Fallback mock
        setVehicles([
          {
            id: '1',
            make: 'Honda',
            model: 'City',
            color: 'White',
            plate: 'MH20 AB 1234',
            seats: 4,
            isActive: true,
          }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchVehicles();
  }, []);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center px-2">
        <h1 className="text-2xl font-bold text-slate-800">My Vehicles</h1>
        <button className="flex items-center space-x-1 text-emerald-600 font-medium bg-emerald-50 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition-colors">
          <Plus className="w-4 h-4" />
          <span>Add</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-500">Loading vehicles...</div>
      ) : vehicles.length === 0 ? (
        <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
          <Car className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No vehicles added yet</p>
          <p className="text-sm text-slate-400 mt-1">Add a vehicle to offer rides.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {vehicles.map((vehicle) => (
            <div key={vehicle.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
                    <Car className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{vehicle.color} {vehicle.make} {vehicle.model}</h3>
                    <p className="text-sm font-mono text-slate-500">{vehicle.plate}</p>
                  </div>
                </div>
                {vehicle.isActive && (
                  <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full">Active</span>
                )}
              </div>
              
              <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-2">
                <div className="text-sm text-slate-500">
                  <span className="font-semibold text-slate-700">{vehicle.seats}</span> seats available
                </div>
                <div className="flex space-x-2">
                  <button className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
