import * as vehicleService from "../services/vehicle.service.js"

export async function list(req, res, next) {
    try {
        const result = await vehicleService.listVehicles(req.query)
        res.status(200).json(result)
    } catch (err) {
        next(err)
    }
}

export async function facets(req, res, next) {
    try {
        const result = await vehicleService.getVehicleFacets()
        res.status(200).json(result)
    } catch (err) {
        next(err)
    }
}

export async function listMine(req, res, next) {
    try {
        const vehicles = await vehicleService.listHostVehicles(req.user.id)
        res.status(200).json({ vehicles })
    } catch (err) {
        next(err)
    }
}

export async function listBlocks(req, res, next) {
    try {
        const blocks = await vehicleService.listVehicleBlocks(req.user.id, req.params.id)
        res.status(200).json({ blocks })
    } catch (err) {
        next(err)
    }
}

export async function createBlock(req, res, next) {
    try {
        const block = await vehicleService.createBlock(req.user.id, req.params.id, req.body)
        res.status(201).json(block)
    } catch (err) {
        next(err)
    }
}

export async function deleteBlock(req, res, next) {
    try {
        await vehicleService.deleteBlock(req.user.id, req.params.blockId)
        res.status(204).send()
    } catch (err) {
        next(err)
    }
}

export async function getById(req, res, next) {
    try {
        const vehicle = await vehicleService.getVehicleById(req.params.id)
        res.status(200).json(vehicle)
    } catch (err) {
        next(err)
    }
}

export async function create(req, res, next) {
    try {
        const vehicle = await vehicleService.createVehicle(req.user.id, req.body)
        res.status(201).json(vehicle)
    } catch (err) {
        next(err)
    }
}

export async function update(req, res, next) {
    try {
        const vehicle = await vehicleService.updateVehicle(req.user.id, req.params.id, req.body)
        res.status(200).json(vehicle)
    } catch (err) {
        next(err)
    }
}

// Contract change: this used to respond 204 with no body. Removing a vehicle
// now has side effects worth reporting (bookings cancelled), so it responds
// 200 with { cancelledBookings } instead.
export async function remove(req, res, next) {
    try {
        const result = await vehicleService.removeVehicle(req.user.id, req.params.id)
        res.status(200).json(result)
    } catch (err) {
        next(err)
    }
}
