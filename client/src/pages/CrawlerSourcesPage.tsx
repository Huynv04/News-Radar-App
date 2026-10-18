import React, { useEffect, useState } from 'react';
import { crawlerSourceApi } from '../services/crawlerSourceApi';
import type { CrawlerSource, CreateCrawlerSourceDto } from '../types/crawlerSource';

export const CrawlerSourcesPage: React.FC = () => {
    const [sources, setSources] = useState<CrawlerSource[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

    const [formData, setFormData] = useState<CreateCrawlerSourceDto>({
        id: '',
        name: '',
        rssUrl: '',
        baseUrl: '',
        isActive: true,
        scanIntervalMinutes: 10,
        selectors: '{"title":"h1.title","sapo":"h2.sapo","body":"div.content"}'
    });

    const fetchSources = async () => {
        try {
            setLoading(true);
            const data = await crawlerSourceApi.getAll();
            setSources(data);
        } catch (error) {
            console.error('Lỗi tải danh sách nguồn cào:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSources();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await crawlerSourceApi.create(formData);
            setIsModalOpen(false);
            fetchSources();
            setFormData({
                id: '',
                name: '',
                rssUrl: '',
                baseUrl: '',
                isActive: true,
                scanIntervalMinutes: 10,
                selectors: '{"title":"h1.title","sapo":"h2.sapo","body":"div.content"}'
            });
        } catch (error) {
            alert('Không thể thêm nguồn cào mới. Vui lòng kiểm tra lại!');
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm(`Bạn có chắc muốn xóa nguồn cào "${id}"?`)) {
            try {
                await crawlerSourceApi.delete(id);
                fetchSources();
            } catch (error) {
                alert('Xóa thất bại!');
            }
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Quản lý Nguồn Cào Tin (Crawler Sources)</h1>
                    <p className="text-sm text-gray-500">Cấu hình RSS Feeds và XPath Selectors cho các trang báo</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                >
                    + Thêm Nguồn Cào Mới
                </button>
            </div>

            {loading ? (
                <div className="text-center py-10 text-gray-500">Đang tải dữ liệu...</div>
            ) : (
                <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                        <thead className="bg-gray-50 text-gray-600 font-semibold uppercase text-xs">
                            <tr>
                                <th className="px-4 py-3">ID / Tên nguồn</th>
                                <th className="px-4 py-3">RSS Link</th>
                                <th className="px-4 py-3">Chu kỳ (Phút)</th>
                                <th className="px-4 py-3">Trạng thái</th>
                                <th className="px-4 py-3 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {sources.map((source) => (
                                <tr key={source.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <div className="font-bold text-gray-900">{source.name}</div>
                                        <div className="text-xs text-gray-400">{source.id}</div>
                                    </td>
                                    <td className="px-4 py-3 text-blue-600 truncate max-w-xs">
                                        <a href={source.rssUrl} target="_blank" rel="noreferrer" className="hover:underline">
                                            {source.rssUrl}
                                        </a>
                                    </td>
                                    <td className="px-4 py-3 text-gray-700">{source.scanIntervalMinutes} phút</td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`px-2 py-1 text-xs font-semibold rounded-full ${source.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                }`}
                                        >
                                            {source.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right space-x-2">
                                        <button
                                            onClick={() => handleDelete(source.id)}
                                            className="text-red-600 hover:text-red-800 text-xs font-medium"
                                        >
                                            Xóa
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal Form thêm nguồn */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h2 className="text-lg font-bold mb-4">Thêm Nguồn Cào Tin Mới</h2>
                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-700">ID Nguồn (VD: tuoitre-thoisu)</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.id}
                                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                                    className="mt-1 block w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700">Tên nguồn</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="mt-1 block w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700">RSS URL</label>
                                <input
                                    type="url"
                                    required
                                    value={formData.rssUrl}
                                    onChange={(e) => setFormData({ ...formData, rssUrl: e.target.value })}
                                    className="mt-1 block w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700">Base URL</label>
                                <input
                                    type="url"
                                    required
                                    value={formData.baseUrl}
                                    onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                                    className="mt-1 block w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700">Chu kỳ cào (phút)</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={formData.scanIntervalMinutes}
                                    onChange={(e) => setFormData({ ...formData, scanIntervalMinutes: Number(e.target.value) })}
                                    className="mt-1 block w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                                />
                            </div>
                            <div className="flex justify-end space-x-2 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 border rounded text-xs text-gray-600"
                                >
                                    Hủy
                                </button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded text-xs font-medium">
                                    Lưu nguồn
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};