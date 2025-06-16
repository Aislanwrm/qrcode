export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      cupom_fiscal: {
        Row: {
          bairro: string | null
          base_calculo_icms: number | null
          cep: string | null
          chave_acesso: string | null
          cidade: string | null
          complemento: string | null
          consumidor_final: number | null
          created_at: string | null
          data_emissao: string | null
          destino_operacao: number | null
          empresa_cnpj: string | null
          empresa_ie: string | null
          empresa_nome: string | null
          estado: string | null
          forma_pagamento: string | null
          hora_emissao: string | null
          id: number
          logradouro: string | null
          modelo: string | null
          numero: string | null
          numero_cupom: string | null
          presenca_comprador: number | null
          protocolo: string | null
          qr_content: string
          quantidade_itens: number | null
          serie: string | null
          updated_at: string | null
          user_id: string
          valor_icms: number | null
          valor_pago: number | null
          valor_total: number | null
        }
        Insert: {
          bairro?: string | null
          base_calculo_icms?: number | null
          cep?: string | null
          chave_acesso?: string | null
          cidade?: string | null
          complemento?: string | null
          consumidor_final?: number | null
          created_at?: string | null
          data_emissao?: string | null
          destino_operacao?: number | null
          empresa_cnpj?: string | null
          empresa_ie?: string | null
          empresa_nome?: string | null
          estado?: string | null
          forma_pagamento?: string | null
          hora_emissao?: string | null
          id?: number
          logradouro?: string | null
          modelo?: string | null
          numero?: string | null
          numero_cupom?: string | null
          presenca_comprador?: number | null
          protocolo?: string | null
          qr_content: string
          quantidade_itens?: number | null
          serie?: string | null
          updated_at?: string | null
          user_id: string
          valor_icms?: number | null
          valor_pago?: number | null
          valor_total?: number | null
        }
        Update: {
          bairro?: string | null
          base_calculo_icms?: number | null
          cep?: string | null
          chave_acesso?: string | null
          cidade?: string | null
          complemento?: string | null
          consumidor_final?: number | null
          created_at?: string | null
          data_emissao?: string | null
          destino_operacao?: number | null
          empresa_cnpj?: string | null
          empresa_ie?: string | null
          empresa_nome?: string | null
          estado?: string | null
          forma_pagamento?: string | null
          hora_emissao?: string | null
          id?: number
          logradouro?: string | null
          modelo?: string | null
          numero?: string | null
          numero_cupom?: string | null
          presenca_comprador?: number | null
          protocolo?: string | null
          qr_content?: string
          quantidade_itens?: number | null
          serie?: string | null
          updated_at?: string | null
          user_id?: string
          valor_icms?: number | null
          valor_pago?: number | null
          valor_total?: number | null
        }
        Relationships: []
      }
      itens_compra: {
        Row: {
          codigo_item: string | null
          created_at: string | null
          cupom_id: number
          id: number
          nome_item: string | null
          quantidade: number | null
          unidade: string | null
          valor_total: number | null
        }
        Insert: {
          codigo_item?: string | null
          created_at?: string | null
          cupom_id: number
          id?: number
          nome_item?: string | null
          quantidade?: number | null
          unidade?: string | null
          valor_total?: number | null
        }
        Update: {
          codigo_item?: string | null
          created_at?: string | null
          cupom_id?: number
          id?: number
          nome_item?: string | null
          quantidade?: number | null
          unidade?: string | null
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "itens_compra_cupom_id_fkey"
            columns: ["cupom_id"]
            isOneToOne: false
            referencedRelation: "cupom_fiscal"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          auto_parse_nfce: boolean | null
          backup_enabled: boolean | null
          created_at: string | null
          id: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_parse_nfce?: boolean | null
          backup_enabled?: boolean | null
          created_at?: string | null
          id?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_parse_nfce?: boolean | null
          backup_enabled?: boolean | null
          created_at?: string | null
          id?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
