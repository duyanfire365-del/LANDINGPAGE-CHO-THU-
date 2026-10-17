export const intentLabels={tenant:'Cần thuê',owner:'Ký gửi cho thuê',owner_sale:'Ký gửi bán',owner_transfer:'Chuyển nhượng'};
export const isConsignment=intent=>['owner','owner_sale','owner_transfer'].includes(intent);
export const priceLabels={owner:'Giá cho thuê (triệu đồng/tháng)',owner_sale:'Giá bán (triệu đồng)',owner_transfer:'Giá chuyển nhượng (triệu đồng)'};
