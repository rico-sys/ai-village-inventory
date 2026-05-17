-- カテゴリテーブルに絵文字列を追加

-- emoji列を追加（デフォルト値はタイプに応じて設定）
ALTER TABLE categories ADD COLUMN emoji TEXT;

-- 既存のrentalカテゴリには🔁、consumableカテゴリには🧴をデフォルトで設定
UPDATE categories SET emoji = '🔁' WHERE type = 'rental' AND emoji IS NULL;
UPDATE categories SET emoji = '🧴' WHERE type = 'consumable' AND emoji IS NULL;

-- 新規カテゴリ作成時のデフォルト値設定（トリガーで対応）
CREATE OR REPLACE FUNCTION set_default_emoji()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.emoji IS NULL THEN
    IF NEW.type = 'rental' THEN
      NEW.emoji := '🔁';
    ELSIF NEW.type = 'consumable' THEN
      NEW.emoji := '🧴';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_default_emoji
BEFORE INSERT ON categories
FOR EACH ROW
EXECUTE FUNCTION set_default_emoji();
