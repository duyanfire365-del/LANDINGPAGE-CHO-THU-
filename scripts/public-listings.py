"""Export only reviewed public fields. Never use the private source as a web asset."""
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
# Explicit display names prevent house/alley/block identifiers leaking through titles.
locations = ['Đỗ Quang','Ao Sen','Lê Văn Thiêm','Vũ Phạm Hàm','Nghĩa Tân','Phạm Huy Thông','Ao Sen','Hồ Đắc Di','Nguyễn Chí Thanh','Đỗ Quang','Nguyễn Chánh','Đường Láng','Huỳnh Thúc Kháng','Nguyễn Viết Xuân','Triều Khúc','Nghĩa Tân','Chùa Láng','Trần Duy Hưng','Đỗ Xuân Hợp, Mỹ Đình','Trần Duy Hưng','Khu đô thị Xa La','Huỳnh Thúc Kháng']
titles = ['Mặt bằng lô góc tại Đỗ Quang','Sang nhượng quán ăn tại Ao Sen','Mặt bằng mặt tiền 7 m tại Lê Văn Thiêm','Tòa nhà 5 tầng tại Vũ Phạm Hàm','Sang nhượng quán ăn tại Nghĩa Tân','Sang nhượng quán cà phê tại Phạm Huy Thông','Sang nhượng quán cà phê lô góc tại Ao Sen','Mặt bằng 60 m² tại Hồ Đắc Di','Mặt bằng hai tầng tại Nguyễn Chí Thanh','Quán cà phê và nhà 5 tầng tại Đỗ Quang','Mặt bằng tầng 1 tại Nguyễn Chánh','Nhà kinh doanh riêng biệt tại Đường Láng','Mặt bằng ba tầng tại Huỳnh Thúc Kháng','Sang nhượng quán ăn lô góc tại Nguyễn Viết Xuân','Mặt bằng tầng 1 tại Triều Khúc','Sang nhượng quán cà phê workshop tại Nghĩa Tân','Sang nhượng quán cà phê lô góc tại Chùa Láng','Sang nhượng quán bún tại Trần Duy Hưng','Kho xưởng riêng biệt 200 m² tại Mỹ Đình','Nhà 5,5 tầng tại Trần Duy Hưng','Nhà 4 tầng, 6 phòng tại khu đô thị Xa La','Tòa nhà có hầm tại Huỳnh Thúc Kháng']

def public_records(records):
    result = []
    fields = ['id','code','slug','area','type','categories','price','size','areaText','facts','description','notes','transferPrice','priceOptions','image','shareImage','status','contactPhone']
    for original in records:
        n = int(original['code'].split('-')[1])-1
        row = {key: original[key] for key in fields if key in original}
        row['title'] = titles[n]
        row['address'] = f"{locations[n]}, {row['area']}, Hà Nội"
        row['notes'] = [note for note in row['notes'] if 'hashtag' not in note.lower()]
        row['imageAlt'] = 'Ảnh minh họa bằng AI: ' + row['title'].lower()
        lines = [row['title'].upper(), '', 'Khu vực: '+row['address'], 'Diện tích: '+row['areaText']]
        for price in row.get('priceOptions', [{'label':'Giá thuê','price':row['price']}]):
            lines.append(f"{price['label']}: {price['price']} triệu đồng/tháng")
        if row.get('transferPrice'):
            lines.append(f"Giá sang nhượng: {row['transferPrice']} triệu đồng (tách riêng tiền thuê)")
        lines += ['• '+fact for fact in row['facts']]
        lines += ['Lưu ý: '+note for note in row['notes']]
        lines += ['', 'Liên hệ 0906 215 365 để nhận địa chỉ chi tiết và xác nhận tình trạng cho thuê.', 'Ảnh minh họa bằng AI, không phải ảnh hiện trạng BĐS.']
        row['shareText'] = '\n'.join(lines)
        result.append(row)
    return result

if __name__ == '__main__':
    import sys
    records = json.loads(Path(sys.argv[1]).read_text())
    (root/'public/listings.json').write_text(json.dumps(public_records(records), ensure_ascii=False, indent=2)+'\n')
