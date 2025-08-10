export const bookingFilterSimple = async (data) => {
  try {
    let bookings = {
      _id: data._id,
      countryData: data.countryData,
      typeService: data.typeService,
      imgUrl: data.imgUrl,
      price: data.price,
      duration: data.duration,
      startTime: data.startTime,
      status: data.status,
      paymentStatus: data.paymentStatus,
      subserviceData: data.subserviceData,
    };
    return bookings;
  } catch (err) {
    throw err;
  }
};

export const filterBookingList = async (data, permissions) => {
  try {
    const bookings = await Promise.all(
      data.map((line) => bookingFilterSimple(line, permissions))
    );
    return bookings;
  } catch (err) {
    throw err;
  }
};
