import { supabase } from './supabase'

export async function logAudit(action: string, tableName: string, recordId: string, oldData?: any, newData?: any) {
  await supabase.from('audit_logs').insert([{
    action,
    table_name: tableName,
    record_id: recordId,
    old_data: oldData,
    new_data: newData,
  })
}
