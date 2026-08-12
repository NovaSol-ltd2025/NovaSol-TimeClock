import React, { useState } from 'react';
import { Branch, Employee, AttendanceRecord } from '../types';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Building2, Users, Compass, CheckCircle2 } from 'lucide-react';

// Fix Leaflet marker icon URLs for React
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

interface BranchMapProps {
  branches: Branch[];
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
}

export const BranchMap: React.FC<BranchMapProps> = ({
  branches,
  employees,
  attendanceRecords,
}) => {
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');

  const todayStr = new Date().toISOString().split('T')[0];

  // Center on Thailand or selected branch
  const selectedBranch = branches.find((b) => b.id === selectedBranchId);
  const mapCenter: [number, number] = selectedBranch
    ? [selectedBranch.latitude, selectedBranch.longitude]
    : [13.7563, 100.5018]; // HQ Bangkok

  const displayBranches =
    selectedBranchId === 'all'
      ? branches
      : branches.filter((b) => b.id === selectedBranchId);

  return (
    <div className="space-y-4">
      {/* Map Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-sky-600" />
            แผนที่ปักหมุดสาขาและรัศมีลงเวลา (Branch Pins & GPS Radius)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            แสดงตำแหน่งสาขาพร้อมวงกลมรัศมีอนุญาตเช็คอิน 100 เมตร และพนักงานที่สังกัดอยู่แต่ละสาขา
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-700">เลือกซูมสาขา:</label>
          <select
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-hidden cursor-pointer"
          >
            <option value="all">🗺️ แสดงทุกสาขาในประเทศไทย</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.type === 'hq' ? '🏢' : '🏪'} {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="h-[520px] w-full rounded-xl overflow-hidden relative z-0">
          <MapContainer
            center={mapCenter}
            zoom={selectedBranchId === 'all' ? 6 : 15}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
            key={`${mapCenter[0]}-${mapCenter[1]}-${selectedBranchId}`}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {displayBranches.map((branch) => {
              const branchEmployees = employees.filter(
                (e) => e.branchId === branch.id && e.status === 'active'
              );
              const clockedInToday = attendanceRecords.filter(
                (r) => r.branchId === branch.id && r.date === todayStr && r.timeIn
              );

              return (
                <React.Fragment key={branch.id}>
                  {/* Pin Marker */}
                  <Marker
                    position={[branch.latitude, branch.longitude]}
                    icon={defaultIcon}
                  >
                    <Popup className="custom-popup">
                      <div className="p-1 space-y-2 max-w-xs">
                        <div className="flex items-center justify-between gap-2 border-b pb-1.5">
                          <h4 className="font-bold text-sm text-slate-900 leading-tight">
                            {branch.name}
                          </h4>
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                              branch.type === 'hq'
                                ? 'bg-sky-100 text-sky-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {branch.type === 'hq' ? 'สำนักงานใหญ่' : 'สาขาย่อย'}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 leading-snug">
                          {branch.address || 'ไม่ระบุที่อยู่'}
                        </p>

                        <div className="bg-sky-50 p-2 rounded-lg text-xs space-y-1">
                          <div className="font-semibold text-sky-900 flex items-center justify-between">
                            <span>รัศมีเช็คอินอนุญาต:</span>
                            <span className="font-bold text-sky-700">
                              {branch.radiusMeters} เมตร
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            Lat: {branch.latitude}, Lng: {branch.longitude}
                          </div>
                        </div>

                        <div className="border-t pt-1.5 flex items-center justify-between text-xs font-semibold text-slate-700">
                          <span>พนักงานที่สังกัด:</span>
                          <span className="text-sky-700 font-bold">
                            {branchEmployees.length} คน (เช็คอินแล้ว {clockedInToday.length} คน)
                          </span>
                        </div>
                      </div>
                    </Popup>
                  </Marker>

                  {/* 100m Allowed Check-in Radius Circle */}
                  <Circle
                    center={[branch.latitude, branch.longitude]}
                    radius={branch.radiusMeters}
                    pathOptions={{
                      color: branch.type === 'hq' ? '#0284c7' : '#059669',
                      fillColor: branch.type === 'hq' ? '#38bdf8' : '#34d399',
                      fillOpacity: 0.25,
                      weight: 2,
                      dashArray: '4, 4',
                    }}
                  />
                </React.Fragment>
              );
            })}
          </MapContainer>
        </div>
      </div>

      {/* Branch Cards Legend */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {branches.map((b) => {
          const emps = employees.filter((e) => e.branchId === b.id && e.status === 'active');
          return (
            <div
              key={b.id}
              onClick={() => setSelectedBranchId(b.id)}
              className={`p-3.5 rounded-xl border cursor-pointer transition ${
                selectedBranchId === b.id
                  ? 'bg-sky-50 border-sky-400 ring-2 ring-sky-300/50'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-xs truncate">{b.name}</span>
                <span className="text-[10px] font-bold text-sky-700 bg-sky-100 px-1.5 py-0.5 rounded">
                  {b.radiusMeters}m
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <Users className="w-3 h-3 text-slate-400" />
                <span>พนักงานสังกัด: {emps.length} คน</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
