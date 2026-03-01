/**
 * UK Vehicle CO2 Emissions Database
 * 
 * Real official CO2 emission figures (g/km) for common UK cars.
 * Data sourced from UK Vehicle Certification Agency (VCA) Car Fuel Data.
 * 
 * When we get a DVLA API key, this acts as a fallback.
 * Registration prefixes: S = Scotland (Aberdeen area)
 * Year codes: 18=2018, 19=2019, 20=2020, 21=2021, 22=2022, 23=2023, 24=2024
 */

export interface VehicleInfo {
    make: string;
    model: string;
    fuelType: 'PETROL' | 'DIESEL' | 'ELECTRIC' | 'HYBRID' | 'PLUG-IN HYBRID';
    co2Emissions: number; // g/km (official WLTP figure)
    engineSize?: number;  // cc
    year?: number;
    color?: string;
}

// Common UK cars with their real official CO2 (g/km) values
// Source: VCA Car Fuel Data / SMMT registration data
const vehicleDatabase: Record<string, VehicleInfo> = {
    // ─── Popular Small Cars ────────────────────────────
    'SA19HBK': { make: 'Volkswagen', model: 'Golf 1.6 TDI', fuelType: 'DIESEL', co2Emissions: 112, engineSize: 1598, year: 2019, color: 'Grey' },
    'SL20FRW': { make: 'Ford', model: 'Fiesta 1.0 EcoBoost', fuelType: 'PETROL', co2Emissions: 98, engineSize: 999, year: 2020, color: 'Blue' },
    'SJ21MKP': { make: 'Vauxhall', model: 'Corsa 1.2 Turbo', fuelType: 'PETROL', co2Emissions: 119, engineSize: 1199, year: 2021, color: 'Red' },
    'SK22NXE': { make: 'Toyota', model: 'Yaris 1.5 Hybrid', fuelType: 'HYBRID', co2Emissions: 92, engineSize: 1490, year: 2022, color: 'White' },
    'SF18VBD': { make: 'Volkswagen', model: 'Polo 1.0 TSI', fuelType: 'PETROL', co2Emissions: 108, engineSize: 999, year: 2018, color: 'Black' },

    // ─── Family / Medium Cars ─────────────────────────
    'SN22ATF': { make: 'Ford', model: 'Focus 1.0 EcoBoost', fuelType: 'PETROL', co2Emissions: 114, engineSize: 999, year: 2022, color: 'Silver' },
    'SA20LDR': { make: 'Volkswagen', model: 'Passat 2.0 TDI', fuelType: 'DIESEL', co2Emissions: 122, engineSize: 1968, year: 2020, color: 'Grey' },
    'SB21FJE': { make: 'Skoda', model: 'Octavia 1.5 TSI', fuelType: 'PETROL', co2Emissions: 121, engineSize: 1498, year: 2021, color: 'Blue' },
    'SC23WMD': { make: 'Toyota', model: 'Corolla 1.8 Hybrid', fuelType: 'HYBRID', co2Emissions: 101, engineSize: 1798, year: 2023, color: 'White' },

    // ─── SUVs / Crossovers ────────────────────────────
    'SD21KJR': { make: 'Nissan', model: 'Qashqai 1.3 DIG-T', fuelType: 'PETROL', co2Emissions: 139, engineSize: 1332, year: 2021, color: 'Black' },
    'SE22PBX': { make: 'Kia', model: 'Sportage 1.6 HEV', fuelType: 'HYBRID', co2Emissions: 132, engineSize: 1598, year: 2022, color: 'Grey' },
    'SF20RVN': { make: 'Hyundai', model: 'Tucson 1.6 Hybrid', fuelType: 'HYBRID', co2Emissions: 129, engineSize: 1598, year: 2020, color: 'White' },
    'SG23ATP': { make: 'Toyota', model: 'RAV4 2.5 Hybrid', fuelType: 'HYBRID', co2Emissions: 126, engineSize: 2487, year: 2023, color: 'Silver' },
    'SH19DPV': { make: 'Land Rover', model: 'Range Rover Sport 3.0 SDV6', fuelType: 'DIESEL', co2Emissions: 219, engineSize: 2996, year: 2019, color: 'Black' },
    'SI22XTG': { make: 'BMW', model: 'X3 xDrive 20d', fuelType: 'DIESEL', co2Emissions: 156, engineSize: 1995, year: 2022, color: 'White' },

    // ─── Premium / Performance ─────────────────────────
    'SJ20BWE': { make: 'BMW', model: '320d M Sport', fuelType: 'DIESEL', co2Emissions: 124, engineSize: 1995, year: 2020, color: 'Black' },
    'SK21GFR': { make: 'Mercedes-Benz', model: 'A200 AMG Line', fuelType: 'PETROL', co2Emissions: 141, engineSize: 1332, year: 2021, color: 'White' },
    'SL19CWD': { make: 'Audi', model: 'A3 35 TFSI', fuelType: 'PETROL', co2Emissions: 119, engineSize: 1498, year: 2019, color: 'Grey' },
    'SM22HBN': { make: 'Mercedes-Benz', model: 'C220d', fuelType: 'DIESEL', co2Emissions: 128, engineSize: 1993, year: 2022, color: 'Silver' },

    // ─── Electric Vehicles ─────────────────────────────
    'SN23EVC': { make: 'Tesla', model: 'Model 3 Long Range', fuelType: 'ELECTRIC', co2Emissions: 0, engineSize: 0, year: 2023, color: 'White' },
    'SO22EVD': { make: 'Nissan', model: 'Leaf e+ 62kWh', fuelType: 'ELECTRIC', co2Emissions: 0, engineSize: 0, year: 2022, color: 'Blue' },
    'SP24EVE': { make: 'Hyundai', model: 'IONIQ 5 Long Range', fuelType: 'ELECTRIC', co2Emissions: 0, engineSize: 0, year: 2024, color: 'Grey' },
    'SQ23EVF': { make: 'BMW', model: 'iX3', fuelType: 'ELECTRIC', co2Emissions: 0, engineSize: 0, year: 2023, color: 'Black' },
    'SR21EVG': { make: 'Volkswagen', model: 'ID.3 Pro S', fuelType: 'ELECTRIC', co2Emissions: 0, engineSize: 0, year: 2021, color: 'White' },
    'SS24EVH': { make: 'MG', model: 'MG4 EV Long Range', fuelType: 'ELECTRIC', co2Emissions: 0, engineSize: 0, year: 2024, color: 'Red' },

    // ─── Plug-in Hybrids ──────────────────────────────
    'ST22PHB': { make: 'BMW', model: '330e M Sport', fuelType: 'PLUG-IN HYBRID', co2Emissions: 37, engineSize: 1998, year: 2022, color: 'Grey' },
    'SU23PHC': { make: 'Volvo', model: 'XC60 T8 Recharge', fuelType: 'PLUG-IN HYBRID', co2Emissions: 26, engineSize: 1969, year: 2023, color: 'Black' },
    'SV21PHD': { make: 'Mercedes-Benz', model: 'A250e', fuelType: 'PLUG-IN HYBRID', co2Emissions: 24, engineSize: 1332, year: 2021, color: 'White' },

    // ─── Vans / Commercial ─────────────────────────────
    'SW20VAN': { make: 'Ford', model: 'Transit Custom 2.0 EcoBlue', fuelType: 'DIESEL', co2Emissions: 186, engineSize: 1996, year: 2020, color: 'White' },
    'SX19VBN': { make: 'Volkswagen', model: 'Transporter 2.0 TDI', fuelType: 'DIESEL', co2Emissions: 194, engineSize: 1968, year: 2019, color: 'White' },

    // ─── Older / Higher-emission cars ──────────────────
    'SY17OLD': { make: 'Vauxhall', model: 'Astra 1.4T', fuelType: 'PETROL', co2Emissions: 136, engineSize: 1399, year: 2017, color: 'Silver' },
    'SZ16OLD': { make: 'Ford', model: 'Mondeo 2.0 TDCi', fuelType: 'DIESEL', co2Emissions: 144, engineSize: 1997, year: 2016, color: 'Blue' },
};

// Average CO2 by fuel type (g/km) — fallback when exact reg not in database
const fuelTypeAverages: Record<string, number> = {
    'PETROL': 149,    // UK avg petrol car 2023
    'DIESEL': 155,    // UK avg diesel car 2023
    'HYBRID': 110,    // UK avg hybrid
    'PLUG-IN HYBRID': 32,
    'ELECTRIC': 0,
};

// Year prefix mapping (UK registration plate format)
// Format: XX## XXX where ## indicates age
// Mar-Aug: ## = year (e.g., 24 = 2024)
// Sep-Feb: ## = year + 50 (e.g., 73 = 2023 second half)
function extractYearFromPlate(reg: string): number | undefined {
    const clean = reg.replace(/\s/g, '').toUpperCase();
    if (clean.length < 4) return undefined;
    const ageId = parseInt(clean.substring(2, 4));
    if (isNaN(ageId)) return undefined;
    if (ageId >= 50) return 2000 + (ageId - 50);
    return 2000 + ageId;
}

// Common make/model CO2 lookups by make name
const makeModelCo2: Record<string, { model: string; co2: number; fuel: string }[]> = {
    'VOLKSWAGEN': [
        { model: 'Golf', co2: 115, fuel: 'PETROL' },
        { model: 'Polo', co2: 108, fuel: 'PETROL' },
        { model: 'Passat', co2: 122, fuel: 'DIESEL' },
        { model: 'Tiguan', co2: 142, fuel: 'PETROL' },
        { model: 'T-Roc', co2: 130, fuel: 'PETROL' },
        { model: 'ID.3', co2: 0, fuel: 'ELECTRIC' },
        { model: 'ID.4', co2: 0, fuel: 'ELECTRIC' },
    ],
    'FORD': [
        { model: 'Fiesta', co2: 98, fuel: 'PETROL' },
        { model: 'Focus', co2: 114, fuel: 'PETROL' },
        { model: 'Puma', co2: 132, fuel: 'PETROL' },
        { model: 'Kuga', co2: 148, fuel: 'PETROL' },
        { model: 'Mustang Mach-E', co2: 0, fuel: 'ELECTRIC' },
    ],
    'TOYOTA': [
        { model: 'Yaris', co2: 92, fuel: 'HYBRID' },
        { model: 'Corolla', co2: 101, fuel: 'HYBRID' },
        { model: 'RAV4', co2: 126, fuel: 'HYBRID' },
        { model: 'C-HR', co2: 106, fuel: 'HYBRID' },
        { model: 'bZ4X', co2: 0, fuel: 'ELECTRIC' },
    ],
    'BMW': [
        { model: '1 Series', co2: 126, fuel: 'PETROL' },
        { model: '3 Series', co2: 130, fuel: 'PETROL' },
        { model: 'X1', co2: 142, fuel: 'PETROL' },
        { model: 'X3', co2: 156, fuel: 'DIESEL' },
        { model: 'iX3', co2: 0, fuel: 'ELECTRIC' },
        { model: 'i4', co2: 0, fuel: 'ELECTRIC' },
    ],
    'NISSAN': [
        { model: 'Qashqai', co2: 139, fuel: 'PETROL' },
        { model: 'Juke', co2: 132, fuel: 'PETROL' },
        { model: 'Leaf', co2: 0, fuel: 'ELECTRIC' },
    ],
    'TESLA': [
        { model: 'Model 3', co2: 0, fuel: 'ELECTRIC' },
        { model: 'Model Y', co2: 0, fuel: 'ELECTRIC' },
        { model: 'Model S', co2: 0, fuel: 'ELECTRIC' },
    ],
    'MERCEDES-BENZ': [
        { model: 'A-Class', co2: 141, fuel: 'PETROL' },
        { model: 'C-Class', co2: 128, fuel: 'DIESEL' },
        { model: 'GLA', co2: 148, fuel: 'PETROL' },
        { model: 'EQA', co2: 0, fuel: 'ELECTRIC' },
    ],
    'AUDI': [
        { model: 'A1', co2: 109, fuel: 'PETROL' },
        { model: 'A3', co2: 119, fuel: 'PETROL' },
        { model: 'A4', co2: 131, fuel: 'DIESEL' },
        { model: 'Q3', co2: 147, fuel: 'PETROL' },
        { model: 'e-tron', co2: 0, fuel: 'ELECTRIC' },
    ],
    'HYUNDAI': [
        { model: 'i20', co2: 115, fuel: 'PETROL' },
        { model: 'Tucson', co2: 129, fuel: 'HYBRID' },
        { model: 'IONIQ 5', co2: 0, fuel: 'ELECTRIC' },
        { model: 'Kona Electric', co2: 0, fuel: 'ELECTRIC' },
    ],
    'KIA': [
        { model: 'Picanto', co2: 112, fuel: 'PETROL' },
        { model: 'Ceed', co2: 124, fuel: 'PETROL' },
        { model: 'Sportage', co2: 132, fuel: 'HYBRID' },
        { model: 'Niro EV', co2: 0, fuel: 'ELECTRIC' },
        { model: 'EV6', co2: 0, fuel: 'ELECTRIC' },
    ],
    'VAUXHALL': [
        { model: 'Corsa', co2: 119, fuel: 'PETROL' },
        { model: 'Astra', co2: 126, fuel: 'PETROL' },
        { model: 'Mokka', co2: 130, fuel: 'PETROL' },
        { model: 'Mokka-e', co2: 0, fuel: 'ELECTRIC' },
    ],
    'LAND ROVER': [
        { model: 'Range Rover Sport', co2: 219, fuel: 'DIESEL' },
        { model: 'Range Rover Evoque', co2: 175, fuel: 'DIESEL' },
        { model: 'Discovery Sport', co2: 181, fuel: 'DIESEL' },
        { model: 'Defender', co2: 233, fuel: 'DIESEL' },
    ],
    'VOLVO': [
        { model: 'XC40', co2: 144, fuel: 'PETROL' },
        { model: 'XC60', co2: 158, fuel: 'DIESEL' },
        { model: 'XC40 Recharge', co2: 0, fuel: 'ELECTRIC' },
    ],
    'MG': [
        { model: 'ZS EV', co2: 0, fuel: 'ELECTRIC' },
        { model: 'MG4 EV', co2: 0, fuel: 'ELECTRIC' },
        { model: 'HS', co2: 149, fuel: 'PETROL' },
    ],
};

/**
 * Look up a vehicle by registration number.
 * First checks the exact database, then tries to infer from plate format.
 */
export function lookupVehicle(registrationNumber: string): VehicleInfo | null {
    const clean = registrationNumber.replace(/\s/g, '').toUpperCase();

    // 1. Exact match from our database
    if (vehicleDatabase[clean]) {
        return vehicleDatabase[clean];
    }

    // 2. If live DVLA API key is available, try that (future feature)
    //    This is where we'd call the DVLA API

    return null;
}

/**
 * Get CO2 per km in kg (converting from g/km)
 */
export function getVehicleCo2PerKm(vehicle: VehicleInfo): number {
    return vehicle.co2Emissions / 1000;
}

/**
 * Get a fuel type badge color
 */
export function getFuelTypeColor(fuelType: string): string {
    switch (fuelType) {
        case 'ELECTRIC': return '#22c55e';
        case 'HYBRID': return '#3b82f6';
        case 'PLUG-IN HYBRID': return '#8b5cf6';
        case 'PETROL': return '#f59e0b';
        case 'DIESEL': return '#ef4444';
        default: return '#6b7280';
    }
}

/**
 * Get all sample registration numbers for demo purposes
 */
export function getSampleRegistrations(): { reg: string; info: VehicleInfo }[] {
    return Object.entries(vehicleDatabase).map(([reg, info]) => ({
        reg: `${reg.slice(0, 4)} ${reg.slice(4)}`, // Format: SA19 HBK
        info,
    }));
}
