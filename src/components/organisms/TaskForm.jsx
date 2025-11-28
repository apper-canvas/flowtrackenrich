import React, { useState } from "react";
import { motion } from "framer-motion";
import ApperFileFieldComponent from "@/components/atoms/FileUploader/ApperFileFieldComponent";
import { fileService } from "@/services/api/fileService";
import ApperIcon from "@/components/ApperIcon";
import Textarea from "@/components/atoms/Textarea";
import Select from "@/components/atoms/Select";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";

const TaskForm = ({ onAddTask }) => {
const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState("medium")
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateForm = () => {
    const newErrors = {}
    
    if (!title.trim()) {
      newErrors.title = "Task title is required"
    }
    
    return newErrors
  }

const getFiles = async (fieldKey) => {
    try {
      if (!window.ApperSDK) return []
      const { ApperFileUploader } = window.ApperSDK
      return await ApperFileUploader.FileField.getFiles(fieldKey)
    } catch (error) {
      console.error("Error getting files:", error)
      return uploadedFiles
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const formErrors = validateForm()
    setErrors(formErrors)
    
    if (Object.keys(formErrors).length > 0) return
    
    setIsSubmitting(true)
    
    try {
      // 1. Retrieve files using SDK method
      const files = await getFiles('file_data_c')
      
      // 2. Create the task first
      const taskData = {
        title_c: title.trim(),
        description_c: description.trim(),
        priority_c: priority,
        status_c: "active",
        file_data_c: files || uploadedFiles
      }

      const createdTask = await onAddTask(taskData)
      
      // 3. If files were attached and task was created, create file records
      if ((files?.length > 0 || uploadedFiles?.length > 0) && createdTask?.Id) {
        await fileService.create({
          file_data_c: files || uploadedFiles,
          description_c: `Files for task: ${title.trim()}`
        }, createdTask.Id)
      }
      
      // Reset form
      setTitle("")
      setDescription("")
      setPriority("medium")
      setUploadedFiles([])
      setErrors({})
      
      // Clear file uploader
      if (window.ApperSDK) {
        const { ApperFileUploader } = window.ApperSDK
        ApperFileUploader.FileField.clearField('file_data_c')
      }
    } catch (error) {
      console.error("Error adding task:", error)
    } finally {
      setIsSubmitting(false)
    }
  }
  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "high": return "AlertTriangle"
      case "medium": return "AlertCircle"
      case "low": return "Minus"
      default: return "AlertCircle"
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high": return "text-error-500"
      case "medium": return "text-warning-500"
      case "low": return "text-slate-500"
      default: return "text-slate-500"
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
            <ApperIcon name="Plus" className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Add New Task</h2>
            <p className="text-sm text-slate-600">Capture your next important task</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Task Title <span className="text-error-500">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              error={errors.title}
              className={errors.title ? "border-error-300" : ""}
            />
            {errors.title && (
              <motion.p 
                className="text-sm text-error-600 flex items-center space-x-1"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <ApperIcon name="AlertCircle" className="w-4 h-4" />
                <span>{errors.title}</span>
              </motion.p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details about this task..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Priority
            </label>
            <div className="relative">
              <Select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </Select>
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <ApperIcon 
                  name={getPriorityIcon(priority)} 
                  className={`w-4 h-4 ${getPriorityColor(priority)}`} 
                />
              </div>
            </div>
</div>

          {/* File Upload Section */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Attach Files (Optional)
            </label>
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
              <ApperFileFieldComponent
                elementId="file_data_c"
                config={{
                  fieldKey: 'file_data_c',
                  fieldName: 'file_data_c',
                  tableName: 'file_c',
                  apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
                  apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY,
                  existingFiles: uploadedFiles,
                  fileCount: uploadedFiles.length
                }}
              />
            </div>
            <p className="text-xs text-slate-500">
              You can attach up to 5 files to this task
<p className="text-xs text-slate-500">
              You can attach up to 5 files to this task
            </p>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              size="lg"
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Adding...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <ApperIcon name="Plus" className="w-4 h-4" />
                  <span>Add Task</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </motion.div>
  )
}

export default TaskForm