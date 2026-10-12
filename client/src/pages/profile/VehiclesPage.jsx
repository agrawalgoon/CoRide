import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Car, Plus, Trash2, X, AlertCircle, FileText, ChevronRight } from 'lucide-react';
import { getVehicles, createVehicle, deleteVehicle } from '../../services/vehicleService';

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const [newVehicle, setNewVehicle] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    plateNumber: '',
    seatCapacity: 4,
    vehicleType: 'SEDAN'
  });

  const fetchVehiclesList = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getVehicles();
      setVehicles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load vehicles:', err);
      setVehicles([]);
      setError(err.response?.data?.message || 'Unable to load vehicles. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehiclesList();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError('');

    try {
      await createVehicle({
        ...newVehicle,
        year: Number(newVehicle.year),
        seatCapacity: Number(newVehicle.seatCapacity)
      });
      setShowAddModal(false);
      setNewVehicle({
        make: '',
        model: '',
        year: new Date().getFullYear(),
        color: '',
        plateNumber: '',
        seatCapacity: 4,
        vehicleType: 'SEDAN'
      });
      fetchVehiclesList();
    } catch (err) {
      console.error('Failed to create vehicle:', err);
      setModalError(
        err.response?.data?.message ||
        err.response?.data?.error?.issues?.[0]?.message ||
        'Failed to add vehicle. Please check your inputs.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this vehicle?')) return;
    try {
      await deleteVehicle(id);
      setVehicles((prev) => prev.filter((v) => v.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove vehicle.');
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center px-2">
        <h1 className="text-2xl font-bold text-slate-800">My Vehicles</h1>
        <button
          onClick={() => { setShowAddModal(true); setModalError(''); }}
          className="flex items-center space-x-1 text-emerald-600 font-medium bg-emerald-50 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Vehicle</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center space-x-2 bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

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
                    <h3 className="font-bold text-slate-800">
                      {vehicle.color} {vehicle.make} {vehicle.model} ({vehicle.year})
                    </h3>
                    <p className="text-sm font-mono text-slate-500">{vehicle.plateNumber}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-full uppercase">
                    {vehicle.vehicleType}
                  </span>
                  {vehicle.isActive && (
                    <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full">
                      Active
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-2">
                <div className="text-sm text-slate-500">
                  <span className="font-semibold text-slate-700">{vehicle.seatCapacity}</span> seats capacity
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleDelete(vehicle.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors"
                    title="Remove vehicle"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Offering Rides? Driving License Card matching UI design */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex items-center justify-between hover:border-emerald-300 transition-all">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="w-14 h-11 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center p-2 text-emerald-700 shadow-2xs">
            <div className="w-full h-full bg-emerald-50 rounded flex flex-col justify-center items-center">
              <FileText className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-bold text-slate-800">Offering Rides?</h4>
            <Link
              to="/profile/driving-license"
              className="text-xs sm:text-sm font-semibold text-sky-600 hover:text-sky-700 hover:underline flex items-center gap-1 mt-0.5"
            >
              Add Driving License
            </Link>
          </div>
        </div>
        <Link
          to="/profile/driving-license"
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </Link>
      </div>

      {/* Add Vehicle Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-slate-800 mb-4">Add a New Vehicle</h2>

            {modalError && (
              <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-sm">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Make</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Honda"
                    value={newVehicle.make}
                    onChange={(e) => setNewVehicle({ ...newVehicle, make: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Model</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. City"
                    value={newVehicle.model}
                    onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Year</label>
                  <input
                    type="number"
                    required
                    min="1990"
                    max={new Date().getFullYear() + 1}
                    value={newVehicle.year}
                    onChange={(e) => setNewVehicle({ ...newVehicle, year: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Color</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. White"
                    value={newVehicle.color}
                    onChange={(e) => setNewVehicle({ ...newVehicle, color: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Plate Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MH20 AB 1234"
                  value={newVehicle.plateNumber}
                  onChange={(e) => setNewVehicle({ ...newVehicle, plateNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm uppercase font-mono outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Seat Capacity</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="10"
                    value={newVehicle.seatCapacity}
                    onChange={(e) => setNewVehicle({ ...newVehicle, seatCapacity: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Type</label>
                  <select
                    value={newVehicle.vehicleType}
                    onChange={(e) => setNewVehicle({ ...newVehicle, vehicleType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-emerald-500 bg-white"
                  >
                    <option value="SEDAN">Sedan</option>
                    <option value="HATCHBACK">Hatchback</option>
                    <option value="SUV">SUV</option>
                    <option value="EV">Electric (EV)</option>
                    <option value="MOTORBIKE">Motorbike</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Adding Vehicle...' : 'Save Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
