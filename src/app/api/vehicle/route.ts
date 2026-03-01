import { NextRequest, NextResponse } from 'next/server';
import { lookupVehicle, getVehicleCo2PerKm } from '@/lib/vehicle-database';

export async function POST(request: NextRequest) {
    try {
        const { registrationNumber } = await request.json();

        if (!registrationNumber || typeof registrationNumber !== 'string') {
            return NextResponse.json(
                { error: 'Registration number is required' },
                { status: 400 }
            );
        }

        const clean = registrationNumber.replace(/\s/g, '').toUpperCase();

        // Validate basic UK plate format (2 letters, 2 digits, 3 letters)
        const ukPlateRegex = /^[A-Z]{2}\d{2}[A-Z]{3}$/;
        if (!ukPlateRegex.test(clean)) {
            return NextResponse.json(
                { error: 'Invalid UK registration format. Expected format: SA19 HBK' },
                { status: 400 }
            );
        }

        // Try DVLA API first if key is available
        const dvlaApiKey = process.env.DVLA_API_KEY;
        if (dvlaApiKey) {
            try {
                const dvlaResponse = await fetch(
                    'https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles',
                    {
                        method: 'POST',
                        headers: {
                            'x-api-key': dvlaApiKey,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ registrationNumber: clean }),
                    }
                );

                if (dvlaResponse.ok) {
                    const dvlaData = await dvlaResponse.json();
                    return NextResponse.json({
                        source: 'dvla',
                        data: {
                            registrationNumber: clean,
                            make: dvlaData.make,
                            model: dvlaData.model || 'Unknown',
                            fuelType: dvlaData.fuelType,
                            co2Emissions: dvlaData.co2Emissions || 0,
                            co2PerKm: (dvlaData.co2Emissions || 0) / 1000,
                            engineCapacity: dvlaData.engineCapacity,
                            yearOfManufacture: dvlaData.yearOfManufacture,
                            colour: dvlaData.colour,
                        }
                    });
                }
            } catch (e) {
                // Fall through to local database
                console.log('DVLA API unavailable, using local database');
            }
        }

        // Fall back to local database
        const vehicle = lookupVehicle(clean);

        if (vehicle) {
            return NextResponse.json({
                source: 'database',
                data: {
                    registrationNumber: clean,
                    make: vehicle.make,
                    model: vehicle.model,
                    fuelType: vehicle.fuelType,
                    co2Emissions: vehicle.co2Emissions,
                    co2PerKm: getVehicleCo2PerKm(vehicle),
                    engineCapacity: vehicle.engineSize,
                    yearOfManufacture: vehicle.year,
                    colour: vehicle.color,
                }
            });
        }

        // If not found anywhere
        return NextResponse.json(
            {
                error: 'Vehicle not found',
                message: 'This registration is not in our database. Try one of our demo plates like SA19 HBK, SN23 EVC, or SH19 DPV.',
                tip: 'Once we get the DVLA API key, any UK plate will work automatically.'
            },
            { status: 404 }
        );

    } catch (error) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
