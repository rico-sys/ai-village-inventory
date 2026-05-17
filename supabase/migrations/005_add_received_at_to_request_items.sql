-- request_itemsテーブルに受取日時を追加
-- お客さんが実際に物品を受け取ったことを記録するためのフィールド

ALTER TABLE request_items ADD COLUMN received_at TIMESTAMPTZ;

-- received_atにコメントを追加（説明用）
COMMENT ON COLUMN request_items.received_at IS 'お客さんが物品を受け取った日時（お客さん側で「受取済み」ボタンを押した時刻）';
