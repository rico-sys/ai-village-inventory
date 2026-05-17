// Supabase Database Types

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      staff: {
        Row: {
          id: string
          name: string
          email: string | null
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          active?: boolean
          created_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          type: 'rental' | 'consumable'
          emoji: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          type: 'rental' | 'consumable'
          emoji?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: 'rental' | 'consumable'
          emoji?: string | null
          created_at?: string
        }
      }
      items: {
        Row: {
          id: string
          name: string
          category_id: string | null
          current_stock: number
          low_stock_alert: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          category_id?: string | null
          current_stock?: number
          low_stock_alert?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          category_id?: string | null
          current_stock?: number
          low_stock_alert?: number
          created_at?: string
        }
      }
      requests: {
        Row: {
          id: string
          visitor_name: string
          seat_number: string
          status: 'pending' | 'delivered' | 'return_requested' | 'returned' | 'cancelled'
          requested_at: string
          delivered_at: string | null
          delivered_by: string | null
          return_requested_at: string | null
          returned_at: string | null
          returned_by: string | null
          note: string | null
        }
        Insert: {
          id?: string
          visitor_name: string
          seat_number: string
          status: 'pending' | 'delivered' | 'return_requested' | 'returned' | 'cancelled'
          requested_at?: string
          delivered_at?: string | null
          delivered_by?: string | null
          return_requested_at?: string | null
          returned_at?: string | null
          returned_by?: string | null
          note?: string | null
        }
        Update: {
          id?: string
          visitor_name?: string
          seat_number?: string
          status?: 'pending' | 'delivered' | 'return_requested' | 'returned' | 'cancelled'
          requested_at?: string
          delivered_at?: string | null
          delivered_by?: string | null
          return_requested_at?: string | null
          returned_at?: string | null
          returned_by?: string | null
          note?: string | null
        }
      }
      request_items: {
        Row: {
          id: string
          request_id: string
          item_id: string | null
          quantity: number
          item_status: 'pending' | 'delivered' | 'return_requested' | 'returned' | 'cancelled'
          delivered_at: string | null
          returned_at: string | null
        }
        Insert: {
          id?: string
          request_id: string
          item_id?: string | null
          quantity?: number
          item_status: 'pending' | 'delivered' | 'return_requested' | 'returned' | 'cancelled'
          delivered_at?: string | null
          returned_at?: string | null
        }
        Update: {
          id?: string
          request_id?: string
          item_id?: string | null
          quantity?: number
          item_status?: 'pending' | 'delivered' | 'return_requested' | 'returned' | 'cancelled'
          delivered_at?: string | null
          returned_at?: string | null
        }
      }
      transactions: {
        Row: {
          id: string
          item_id: string | null
          action: 'out' | 'in' | 'restock' | 'adjust'
          quantity: number
          actor_type: 'staff' | 'visitor'
          actor_id: string | null
          visitor_name: string | null
          request_item_id: string | null
          timestamp: string
          note: string | null
        }
        Insert: {
          id?: string
          item_id?: string | null
          action: 'out' | 'in' | 'restock' | 'adjust'
          quantity: number
          actor_type: 'staff' | 'visitor'
          actor_id?: string | null
          visitor_name?: string | null
          request_item_id?: string | null
          timestamp?: string
          note?: string | null
        }
        Update: {
          id?: string
          item_id?: string | null
          action?: 'out' | 'in' | 'restock' | 'adjust'
          quantity?: number
          actor_type?: 'staff' | 'visitor'
          actor_id?: string | null
          visitor_name?: string | null
          request_item_id?: string | null
          timestamp?: string
          note?: string | null
        }
      }
    }
  }
}

// ヘルパー型
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// 個別テーブル型のエクスポート
export type Staff = Tables<'staff'>
export type Category = Tables<'categories'>
export type Item = Tables<'items'>
export type Request = Tables<'requests'>
export type RequestItem = Tables<'request_items'>
export type Transaction = Tables<'transactions'>

// JOIN結果の型
export type ItemWithCategory = Item & {
  category: Category | null
}

export type RequestWithItems = Request & {
  request_items: (RequestItem & {
    item: Item | null
  })[]
}

export type RequestItemWithItem = RequestItem & {
  item: Item | null
}
