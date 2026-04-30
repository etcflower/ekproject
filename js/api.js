/**
 * ============================================
 * EK프로젝트 - Data API Abstraction Layer
 * ============================================
 *
 * 이 파일은 데이터 접근 로직을 추상화하여
 * 향후 Supabase로 마이그레이션 시 이 파일만 수정하면 됩니다.
 *
 * [현재 단계] 내장 RESTful Table API 사용
 * [향후 단계] Supabase JS SDK로 교체
 *
 * Supabase 마이그레이션 시 변경 방법:
 *   1) <head>에 supabase-js CDN 추가
 *   2) 아래 SupabaseAdapter의 주석 해제
 *   3) DataAPI.adapter = new SupabaseAdapter() 로 변경
 *   → main.js / admin.js 코드는 수정 불필요
 * ============================================
 */

/* ============================================
 * Adapter 1: 내장 Table API (현재 사용)
 * ============================================ */
class TableApiAdapter {
    constructor(tableName) {
        this.tableName = tableName;
    }

    async list({ page = 1, limit = 100, sort = 'display_order' } = {}) {
        const url = `tables/${this.tableName}?page=${page}&limit=${limit}&sort=${sort}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to list ${this.tableName}`);
        const json = await res.json();
        // 삭제된(deleted=true) 항목 필터링
        const data = (json.data || []).filter(r => !r.deleted);
        return data;
    }

    async get(id) {
        const res = await fetch(`tables/${this.tableName}/${id}`);
        if (!res.ok) throw new Error('Not found');
        return await res.json();
    }

    async create(data) {
        const res = await fetch(`tables/${this.tableName}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Create failed');
        return await res.json();
    }

    async update(id, data) {
        const res = await fetch(`tables/${this.tableName}/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Update failed');
        return await res.json();
    }

    async remove(id) {
        const res = await fetch(`tables/${this.tableName}/${id}`, {
            method: 'DELETE'
        });
        if (!res.ok && res.status !== 204) throw new Error('Delete failed');
        return true;
    }
}

/* ============================================
 * Adapter 2: Supabase (향후 사용 예정)
 * ============================================
 *
 * 사용 시점이 되면 아래 주석을 풀고 사용하세요.
 *
 * 사전 준비:
 *   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
 *
class SupabaseAdapter {
    constructor(tableName) {
        this.tableName = tableName;
        const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
        const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
        this.client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }

    async list({ sort = 'display_order' } = {}) {
        const { data, error } = await this.client
            .from(this.tableName)
            .select('*')
            .order(sort, { ascending: true });
        if (error) throw error;
        return data;
    }

    async get(id) {
        const { data, error } = await this.client
            .from(this.tableName)
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw error;
        return data;
    }

    async create(data) {
        const { data: row, error } = await this.client
            .from(this.tableName)
            .insert(data)
            .select()
            .single();
        if (error) throw error;
        return row;
    }

    async update(id, data) {
        const { data: row, error } = await this.client
            .from(this.tableName)
            .update(data)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return row;
    }

    async remove(id) {
        const { error } = await this.client
            .from(this.tableName)
            .delete()
            .eq('id', id);
        if (error) throw error;
        return true;
    }
}
*/

/* ============================================
 * Public API
 * ============================================ */
const SeminarAPI = new TableApiAdapter('seminars');

/* 전역으로 노출 */
window.SeminarAPI = SeminarAPI;
