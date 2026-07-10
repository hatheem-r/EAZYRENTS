import { vehicles } from "../data/mockData"

const DELAY_MS = 600

function delay(value) {
    return new Promise(resolve => setTimeout(() => resolve(value), DELAY_MS))
}

// export function getVehicles(filters = {}) {
//     const { type, location, make, minPrice, maxPrice } = filters

//     const filtered = vehicles.filter(vehicle => {
//         if (type && vehicle.type.toLowerCase() !== type.toLowerCase()) return false
//         if (location && vehicle.location.toLowerCase() !== location.toLowerCase()) return false
//         if (make && vehicle.make.toLowerCase() !== make.toLowerCase()) return false
//         if (minPrice && vehicle.pricePerDay < Number(minPrice)) return false
//         if (maxPrice && vehicle.pricePerDay > Number(maxPrice)) return false
//         return true
//     })

//     return delay(filtered)//arti delay
// }


export function getVehicles(props) {

    const filtered = vehicles.filter(vehicle => {
        if (props.type && vehicle.type.toLowerCase() !== props.type.toLowerCase()) return false
        return true
    })

    return delay(filtered)//arti delay
}

export function getVehicle(id) {
    const vehicle = vehicles.find(v => v.id === id)

    if (!vehicle) {
        return delay(null).then(() => {
            throw new Error(`Vehicle ${id} not found`)
        })
    }

    return delay(vehicle)
}

export function getAllVehicleTypes() {
    // const types = vehicles.map(vehicle => vehicle.type.toLowerCase() === type.toLowerCase())
    const types = [...new Set(vehicles.map(vehicle => vehicle.type))]


    return(
        delay(types)
    )
}