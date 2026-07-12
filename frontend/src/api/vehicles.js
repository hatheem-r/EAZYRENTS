import supabase from "../supabase-client"

let vehiclesCache = null
let fetchPromise = null
let channel = null
const listeners = new Set()

function notifyListeners() {
    listeners.forEach(listener => listener(vehiclesCache))
}

function applyRealtimeEvent(payload) {
    if (!vehiclesCache) return

    if (payload.eventType === "INSERT") {
        vehiclesCache = [...vehiclesCache, payload.new]
    } else if (payload.eventType === "UPDATE") {
        vehiclesCache = vehiclesCache.map(vehicle =>
            vehicle.id === payload.new.id ? payload.new : vehicle
        )
    } else if (payload.eventType === "DELETE") {
        vehiclesCache = vehiclesCache.filter(vehicle => vehicle.id !== payload.old.id)
    }

    notifyListeners()
}

function ensureRealtimeChannel() {
    if (channel) return

    channel = supabase
        .channel("vehicles-changes")
        .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "vehicles" },
            applyRealtimeEvent
        )
        .subscribe()
}

function fetchAllVehicles() {
    console.log("Fetching all vehicles...")
    if (vehiclesCache) {
        return Promise.resolve({ data: vehiclesCache, error: null })
    }

    if (fetchPromise) {
        return fetchPromise
    }

    fetchPromise = supabase
        .from("vehicles")
        .select("*")
        .then(({ data, error }) => {
            fetchPromise = null

            if (!error) {
                vehiclesCache = data
                ensureRealtimeChannel()
            }
            console.log("Fetched vehicles:", data)
            return { data, error }
        })

    return fetchPromise
}

export function subscribeToVehicles(listener) {
    listeners.add(listener)
    return () => listeners.delete(listener)
}

export function getAllVehicleTypes() {
    return fetchAllVehicles().then(({ data, error }) => ({
        data: data ? [...new Set(data.map(vehicle => vehicle.type).filter(Boolean))] : data,
        error,
    }))
}

export function getVehicles(filters = {}) {
    return fetchAllVehicles().then(({ data, error }) => {
        if (!data) return { data, error }

        const filtered = filters.type
            ? data.filter(vehicle => vehicle.type?.toLowerCase() === filters.type.toLowerCase())
            : data

        return { data: filtered, error }
    })
}

export function getVehicle(id) {
    return fetchAllVehicles().then(({ data, error }) => {
        if (error) return { data: null, error }

        const vehicle = data.find(v => String(v.id) === String(id))

        if (!vehicle) {
            return { data: null, error: new Error(`Vehicle ${id} not found`) }
        }

        return { data: vehicle, error: null }
    })
}
