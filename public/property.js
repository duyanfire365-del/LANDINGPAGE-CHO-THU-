(() => {
  const record=window.RENTAL_LISTINGS.find(listing=>listing.id===Number(document.body.dataset.propertyId));
  if(record){document.querySelector('#property-sharing').innerHTML=RentalSharing.markup(record);RentalSharing.prepare(record);}
})();
