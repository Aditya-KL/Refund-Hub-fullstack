import { useState, useEffect } from 'react';

// ✅ FIX 1: Changed status from a strict union to 'string'
export interface Claim {
  id: string;
  type: string;
  amount: number;
  status: string; 
  date: string;
  description: string;
}

interface ClaimStatusCardProps {
  claim: Claim;
  onClick?: () => void;
}

export function ClaimStatusCard({ claim, onClick }: ClaimStatusCardProps) {
  
  // ✅ FIX 2: Smarter color logic using .includes()
  const getStatusConfig = (status: string) => {
    const lowerStatus = status.toLowerCase();

    if (lowerStatus.includes('approved')) {
      return {
        color: 'text-yellow-700',
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
      };
    }
    if (lowerStatus.includes('refunded')) {
      return {
        color: 'text-green-700', // Beautiful green for fully completed refunds!
        bg: 'bg-green-50',
        border: 'border-green-200',
      };
    }
    if (lowerStatus.includes('rejected')) {
      return {
        color: 'text-red-700',
        bg: 'bg-red-50',
        border: 'border-red-200',
      };
    }
    if (lowerStatus.includes('processing')) {
      return {
        color: 'text-blue-700',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
      };
    }
    
    // Default fallback (catches all the "Pending (VP)", "Pending (Team Coord)", etc.)
    return {
      color: 'text-orange-700',
      bg: 'bg-orange-50',
      border: 'border-orange-200',
    };
  };

  const statusConfig = getStatusConfig(claim.status);

  return (
    <div 
      onClick={onClick}
      className={`bg-white border border-gray-200 rounded-lg p-5 ${onClick ? 'cursor-pointer hover:shadow-md hover:border-gray-300 transition-all' : ''}`}
    >
      {/* Header Row: Category and Status Badge */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 text-lg">{claim.type}</h3>
        
        {/* ✅ FIX 3: Print claim.status directly so it shows the exact text from the database */}
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border} border`}>
          {claim.status} 
        </span>
      </div>
      
      {/* Bottom Row: Amount and Date */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-gray-500 mb-1">Amount</p>
          <p className="text-2xl font-bold text-gray-900">₹{claim.amount.toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 mb-1">Date</p>
          <p className="text-sm font-medium text-gray-700">{claim.date}</p>
        </div>
      </div>
    </div>
  );
}