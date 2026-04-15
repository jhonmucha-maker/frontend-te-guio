import { useState, useEffect } from 'react';
import { HiOutlinePencil, HiOutlineTrash, HiOutlinePlus, HiOutlineCheck, HiOutlineX } from 'react-icons/hi';
import toast from 'react-hot-toast';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import Modal from '../ui/Modal';
import { adminService } from '../../services/adminService';

// ---- Sortable Feature Item ----
function SortableFeatureItem({ feature, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(feature.texto);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: feature.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSave = () => {
    if (text.trim().length < 3) return;
    onEdit(feature.id, text.trim());
    setEditing(false);
  };

  const handleCancel = () => {
    setText(feature.texto);
    setEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-xl group"
    >
      <button
        type="button"
        className="cursor-grab text-gray-400 hover:text-gray-600 shrink-0"
        {...attributes}
        {...listeners}
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M7 2a2 2 0 10.001 4.001A2 2 0 007 2zm0 6a2 2 0 10.001 4.001A2 2 0 007 8zm0 6a2 2 0 10.001 4.001A2 2 0 007 14zm6-8a2 2 0 10-.001-4.001A2 2 0 0013 6zm0 2a2 2 0 10.001 4.001A2 2 0 0013 8zm0 6a2 2 0 10.001 4.001A2 2 0 0013 14z" />
        </svg>
      </button>

      {editing ? (
        <div className="flex-1 flex items-center gap-1">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            maxLength={200}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
          />
          <button type="button" onClick={handleSave} className="text-green-600 p-1">
            <HiOutlineCheck className="w-4 h-4" />
          </button>
          <button type="button" onClick={handleCancel} className="text-gray-400 p-1">
            <HiOutlineX className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <>
          <span className="flex-1 text-sm text-gray-700 truncate">{feature.texto}</span>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-primary-500 p-1 transition-opacity"
          >
            <HiOutlinePencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(feature.id)}
            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1 transition-opacity"
          >
            <HiOutlineTrash className="w-3.5 h-3.5" />
          </button>
        </>
      )}
    </div>
  );
}

// ---- Main Dialog ----
export default function PlanFormDialog({ open, onClose, editItem, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [loadingFeatures, setLoadingFeatures] = useState(false);
  const [features, setFeatures] = useState([]);
  const [newFeatureText, setNewFeatureText] = useState('');
  const [addingFeature, setAddingFeature] = useState(false);

  const [form, setForm] = useState({
    nombre: '',
    precio: '',
    duracion_dias: '',
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (open && editItem) {
      setForm({
        nombre: editItem.nombre || '',
        precio: editItem.precio?.toString() || '',
        duracion_dias: editItem.duracion_dias?.toString() || '',
      });
      loadFeatures(editItem.id);
    }
  }, [open, editItem]);

  const loadFeatures = async (planId) => {
    setLoadingFeatures(true);
    try {
      const { data } = await adminService.getPlanFeatures(planId);
      setFeatures(Array.isArray(data) ? data : []);
    } catch {
      setFeatures([]);
    } finally {
      setLoadingFeatures(false);
    }
  };

  const handleSubmitPlan = async (e) => {
    e.preventDefault();
    if (!editItem) return;
    setSaving(true);
    try {
      await adminService.updatePlan(editItem.id, {
        nombre: form.nombre,
        precio: parseFloat(form.precio),
        duracion_dias: parseInt(form.duracion_dias),
      });
      toast.success('Plan actualizado');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al actualizar');
    } finally {
      setSaving(false);
    }
  };

  const handleAddFeature = async () => {
    if (!editItem || newFeatureText.trim().length < 3) return;
    setAddingFeature(true);
    try {
      const { data } = await adminService.createPlanFeature(editItem.id, { texto: newFeatureText.trim() });
      setFeatures((prev) => [...prev, data]);
      setNewFeatureText('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al agregar');
    } finally {
      setAddingFeature(false);
    }
  };

  const handleEditFeature = async (featureId, texto) => {
    try {
      const { data } = await adminService.updatePlanFeature(editItem.id, featureId, { texto });
      setFeatures((prev) => prev.map((f) => (f.id === featureId ? data : f)));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al editar');
    }
  };

  const handleDeleteFeature = async (featureId) => {
    try {
      await adminService.deletePlanFeature(editItem.id, featureId);
      setFeatures((prev) => prev.filter((f) => f.id !== featureId));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al eliminar');
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = features.findIndex((f) => f.id === active.id);
    const newIndex = features.findIndex((f) => f.id === over.id);
    const reordered = arrayMove(features, oldIndex, newIndex);
    setFeatures(reordered);

    try {
      const ids = reordered.map((f) => f.id);
      await adminService.reorderPlanFeatures(editItem.id, ids);
    } catch {
      loadFeatures(editItem.id);
      toast.error('Error al reordenar');
    }
  };

  const planLabel = editItem?.tipo === 'ESTANDAR' ? 'Plan Estándar' : editItem?.tipo === 'PREMIUM' ? 'Plan Premium' : editItem?.tipo || '';

  return (
    <Modal open={open} onClose={onClose} title={`Editar ${planLabel}`} maxWidth="max-w-md">
      {/* Plan fields */}
      <form onSubmit={handleSubmitPlan} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Nombre visible <span className="text-coral-500">*</span>
          </label>
          <input
            type="text"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            className="input-field text-sm"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Precio (S/) <span className="text-coral-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.precio}
              onChange={(e) => setForm({ ...form, precio: e.target.value })}
              className="input-field text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Duracion (dias) <span className="text-coral-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={form.duracion_dias}
              onChange={(e) => setForm({ ...form, duracion_dias: e.target.value })}
              className="input-field text-sm"
              required
            />
          </div>
        </div>
        <button type="submit" disabled={saving} className="btn-primary w-full text-sm">
          {saving ? 'Guardando...' : 'Actualizar'}
        </button>
      </form>

      {/* Features section */}
      <div className="mt-5 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-bold text-gray-900 mb-3">Caracteristicas del plan</h4>

        {loadingFeatures ? (
          <div className="flex items-center justify-center py-6">
            <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={features.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-1.5 mb-3">
                  {features.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">
                      No hay caracteristicas. Agrega una abajo.
                    </p>
                  )}
                  {features.map((feature) => (
                    <SortableFeatureItem
                      key={feature.id}
                      feature={feature}
                      onEdit={handleEditFeature}
                      onDelete={handleDeleteFeature}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newFeatureText}
                onChange={(e) => setNewFeatureText(e.target.value)}
                placeholder="Nueva caracteristica..."
                className="flex-1 input-field text-sm"
                maxLength={200}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddFeature();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddFeature}
                disabled={addingFeature || newFeatureText.trim().length < 3}
                className="btn-primary text-sm px-3 py-2 flex items-center gap-1 disabled:opacity-50"
              >
                <HiOutlinePlus className="w-4 h-4" />
                Agregar
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
