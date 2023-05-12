const { uuid } = require('uuidv4');
const { validationResult } = require('express-validator');

const HttpError = require('../models/http-error');
const getCoordsForAddress = require('../util/location');
const Place = require('../models/place');
// const place = require('../models/place');

let DUMMY_PLACES = [
  {
    id: 'p1',
    title: 'Empire State Building',
    description: 'One of the most famous sky scrapers in the world!',
    location: {
      lat: 40.7484474,
      lng: -73.9871516
    },
    address: '20 W 34th St, New York, NY 10001',
    creator: 'u1'
  }
];

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid; // { pid: 'p1' }

  let place;
  try{
     place = await Place.findById(placeId);
  } catch (err) {
      const error = new HttpError('Something went wrong, could not find a place', 500)
      
    }


  if (!place) {
    const error = new HttpError('Could not find a place for the provided id.', 404);
  return next(error)
  }


  res.json({ place: place.toObject({ getters: true }) }); // => { place } => { place: place }
};

// function getPlaceById() { ... }
// const getPlaceById = function() { ... }

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  let places
  try {
     places = await Place.find({ creator: userId})
  } catch (err) {
    if (!places) {
       const error =  new HttpError('Could not find places for the provided user id.', 500)
     }
     return next(error)
  }

  if (!places || places.length === 0) {
    return next(
      new HttpError('Could not find places for the provided user id.', 404)
    )
  }
  res.json({ places: places.map(place => place.toObject({ getters: true }))});
};

const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
   return next(new HttpError('Invalid inputs passed, please check your data.', 404));
  }

  const { title, description, address, creator } = req.body;

  let coordinates;
  try {
    coordinates = await getCoordsForAddress(address);
  } catch (error) {
    return next(error);
  }

  // const title = req.body.title;
  const createdPlace = new Place({
    title,
    description,
    address,
    location: coordinates,
    image: 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/b6ff0824-6ddd-4503-b5be-3dbc0b60c40f/ddhdrln-f8fb07b7-7259-4036-8761-8ead2adc6898.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiJcL2ZcL2I2ZmYwODI0LTZkZGQtNDUwMy1iNWJlLTNkYmMwYjYwYzQwZlwvZGRoZHJsbi1mOGZiMDdiNy03MjU5LTQwMzYtODc2MS04ZWFkMmFkYzY4OTguanBnIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.REFUpiI5lR1dY7nuuXwGRR_sQhX_yv1NwpRQTItPz84',
    creator
  });
  try {
    await createdPlace.save(); 
  } catch (err) {
    const error = new HttpError('Creating place failed, please try again', 500)
    return next(error)
  };

  res.status(201).json({ place: createdPlace });
};

const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new HttpError('Invalid inputs passed, please check your data.', 422);
  }

  const { title, description } = req.body;
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId)
  } catch (err) {
    const error = new HttpError("Something went wrong, could not update place", 500);
    return next(error)
  }

  // const updatedPlace = { ...DUMMY_PLACES.find(p => p.id === placeId) };
  // const placeIndex = DUMMY_PLACES.findIndex(p => p.id === placeId);
  place.title = title;
  place.description = description;

  // DUMMY_PLACES[placeIndex] = updatedPlace;
  try {
     await place.save()
  } catch (err) {
    const error = new HttpError('Something went wrong, could not update place', 500);
    return next(error)
  }

  res.status(200).json({ place: place.toObject({getters: true}) });
};

const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;
  
  let place;
  try {
    place = await Place.findById(placeId)
  } catch(err) {
    const error = new HttpError('Something went worng, could not delete the place',500)
    return next(error)
  }

  try{
   await place.remove();
  } catch(err) {
  const error = new HttpError('Something went wrong, could not delete the place',500)
  return next(error)
}
  
  res.status(200).json({ message: 'Deleted place.' });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
