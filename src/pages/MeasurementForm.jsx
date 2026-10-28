import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Scales, FloppyDisk } from '@phosphor-icons/react'
import { children } from '../data/mockData'
import { showSuccess, showError } from '../utils/swal'

const fields = [
  { key: 'berat', label: 'Berat Badan', unit: 'kg', placeholder: 'contoh: 9.5', step: '0.1' },
  { key: 'tinggi', label: 'Tinggi / Panjang Badan', unit: 'cm', placeholder: 'contoh: 85.0', step: '0.1' },
  { key: 'lingkarKepala', label: 'Lingkar Kepala', unit: 'cm', placeholder: 'contoh: 45.0', step: '0.1' },
]

export default function MeasurementForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const child = children.find((c) => c.id === Number(id))

  const [values, setValues] = useState({ berat: '', tinggi: '', lingkarKepala: '' })
  const [errors, setErrors] = useState({})

  const handleChange = (key, val) => {
    setValues((v) => ({ ...v, [key]: val }))
    setErrors((e) => ({ ...e, [key]: '' }))
  }

  const validate = () => {
    const newErrors = {}
    fields.forEach(({ key }) => {
      const v = values[key].trim()
      if (v === '') {
        newErrors[key] = 'Wajib diisi'
      } else if (isNaN(Number(v)) || Number(v) <= 0) {
        newErrors[key] = 'Masukkan angka yang valid (> 0)'
      }
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) {
      showError('Validasi Gagal', 'Periksa kembali isian form.')
      return
    }
    await showSuccess('Data pengukuran berhasil disimpan.')
    navigate(`/balita/${id}`)
  }

  if (!child) {
    return (
      <section className="flex flex-col gap-4">
        <Link to="/balita" className="inline-flex items-center gap-2 text-purple font-medium min-h-[48px]">
          <ArrowLeft size={20} /> Kembali
        </Link>
        <p className="text-gray-500">Data balita tidak ditemukan.</p>
      </section>
    )
  }

  return (
    <section className="flex flex-col gap-5">
      <Link to={`/balita/${id}`} className="inline-flex items-center gap-2 text-purple font-medium min-h-[48px]">
        <ArrowLeft size={20} /> Kembali
      </Link>

      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-gray-900">Form Pengukuran</h1>
        <p className="text-gray-500 text-sm mt-1">
          Input data bulanan untuk <span className="font-semibold text-gray-700">{child.name}</span>.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-5 shadow-sm border border-purple-50 flex flex-col gap-5">
        {fields.map(({ key, label, unit, placeholder, step }) => (
          <div key={key} className="flex flex-col gap-2">
            <label htmlFor={key} className="font-heading font-semibold text-gray-800 text-sm">
              {label} <span className="text-gray-400 font-normal">({unit})</span>
            </label>
            <div className="relative">
              <input
                id={key}
                type="text"
                inputMode="decimal"
                value={values[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                placeholder={placeholder}
                className={`w-full min-h-[52px] px-4 pr-14 rounded-xl border text-base focus:outline-none focus:ring-2 ${
                  errors[key]
                    ? 'border-red-400 focus:ring-red-200'
                    : 'border-purple-100 focus:ring-purple/40 focus:border-purple'
                }`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
                {unit}
              </span>
            </div>
            {errors[key] && <p className="text-red-500 text-xs">{errors[key]}</p>}
          </div>
        ))}

        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 min-h-[52px] px-6 rounded-xl bg-purple text-white font-semibold text-base hover:bg-purple-600 active:scale-[0.99] transition-all w-full"
        >
          <FloppyDisk size={22} weight="fill" /> Simpan Pengukuran
        </button>
      </form>
    </section>
  )
}
