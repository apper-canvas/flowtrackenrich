import { getApperClient } from '@/services/apperClient'
import { toast } from 'react-toastify'

const TABLE_NAME = 'file_c'

export const fileService = {
  async getAll() {
    try {
      const apperClient = getApperClient()
      if (!apperClient) {
        throw new Error("ApperClient not initialized")
      }

      const params = {
        fields: [
          {"field": {"Name": "Name"}},
          {"field": {"Name": "file_data_c"}},
          {"field": {"Name": "task_c"}},
          {"field": {"Name": "file_size_kb_c"}},
          {"field": {"Name": "upload_date_c"}},
          {"field": {"Name": "description_c"}},
          {"field": {"Name": "CreatedOn"}},
          {"field": {"Name": "ModifiedOn"}}
        ],
        orderBy: [{"fieldName": "CreatedOn", "sorttype": "DESC"}],
        pagingInfo: {"limit": 100, "offset": 0}
      }

      const response = await apperClient.fetchRecords(TABLE_NAME, params)

      if (!response?.data?.length) {
        return []
      }

      return response.data
    } catch (error) {
      console.error("Error fetching files:", error?.response?.data?.message || error)
      return []
    }
  },

  async getById(recordId) {
    try {
      const apperClient = getApperClient()
      if (!apperClient) {
        throw new Error("ApperClient not initialized")
      }

      const params = {
        fields: [
          {"field": {"Name": "Name"}},
          {"field": {"Name": "file_data_c"}},
          {"field": {"Name": "task_c"}},
          {"field": {"Name": "file_size_kb_c"}},
          {"field": {"Name": "upload_date_c"}},
          {"field": {"Name": "description_c"}},
          {"field": {"Name": "CreatedOn"}},
          {"field": {"Name": "ModifiedOn"}}
        ]
      }

      const response = await apperClient.getRecordById(TABLE_NAME, recordId, params)

      return response?.data || null
    } catch (error) {
      console.error(`Error fetching file ${recordId}:`, error?.response?.data?.message || error)
      return null
    }
  },

  async getByTaskId(taskId) {
    try {
      const apperClient = getApperClient()
      if (!apperClient) {
        throw new Error("ApperClient not initialized")
      }

      const params = {
        fields: [
          {"field": {"Name": "Name"}},
          {"field": {"Name": "file_data_c"}},
          {"field": {"Name": "task_c"}},
          {"field": {"Name": "file_size_kb_c"}},
          {"field": {"Name": "upload_date_c"}},
          {"field": {"Name": "description_c"}},
          {"field": {"Name": "CreatedOn"}},
          {"field": {"Name": "ModifiedOn"}}
        ],
        where: [{
          "FieldName": "task_c",
          "Operator": "EqualTo",
          "Values": [parseInt(taskId)]
        }],
        orderBy: [{"fieldName": "CreatedOn", "sorttype": "DESC"}],
        pagingInfo: {"limit": 50, "offset": 0}
      }

      const response = await apperClient.fetchRecords(TABLE_NAME, params)

      return response?.data || []
    } catch (error) {
      console.error(`Error fetching files for task ${taskId}:`, error?.response?.data?.message || error)
      return []
    }
  },

  async create(formData, taskId) {
    try {
      const apperClient = getApperClient()
      if (!apperClient) {
        throw new Error("ApperClient not initialized")
      }

      // Convert files to API format using SDK method
      const { ApperFileUploader } = window.ApperSDK
      const convertedFiles = ApperFileUploader.toCreateFormat(formData.file_data_c)

      const params = {
        records: [{
          // Only include fields with visibility: "Updateable"
          Name: formData.Name || formData.file_data_c[0]?.Name,
          file_data_c: convertedFiles,
          task_c: parseInt(taskId),
          file_size_kb_c: formData.file_data_c[0]?.Size ? Math.round(formData.file_data_c[0].Size / 1024) : 0,
          upload_date_c: new Date().toISOString(),
          description_c: formData.description_c || ""
        }]
      }

      const response = await apperClient.createRecord(TABLE_NAME, params)

      if (!response.success) {
        console.error(response.message)
        toast.error(response.message)
        return null
      }

      if (response.results) {
        const successful = response.results.filter(r => r.success)
        const failed = response.results.filter(r => !r.success)

        if (failed.length > 0) {
          console.error(`Failed to create ${failed.length} file records: ${JSON.stringify(failed)}`)
          failed.forEach(record => {
            record.errors?.forEach(error => toast.error(`${error.fieldLabel}: ${error}`))
            if (record.message) toast.error(record.message)
          })
        }

        return successful.length > 0 ? successful[0].data : null
      }
    } catch (error) {
      console.error("Error creating file record:", error?.response?.data?.message || error)
      return null
    }
  },

  async update(recordId, updateData) {
    try {
      const apperClient = getApperClient()
      if (!apperClient) {
        throw new Error("ApperClient not initialized")
      }

      const params = {
        records: [{
          Id: parseInt(recordId),
          // Only include fields with visibility: "Updateable"
          ...(updateData.Name !== undefined && { Name: updateData.Name }),
          ...(updateData.description_c !== undefined && { description_c: updateData.description_c }),
          ...(updateData.file_size_kb_c !== undefined && { file_size_kb_c: updateData.file_size_kb_c })
        }]
      }

      const response = await apperClient.updateRecord(TABLE_NAME, params)

      if (!response.success) {
        console.error(response.message)
        toast.error(response.message)
        return null
      }

      if (response.results) {
        const successful = response.results.filter(r => r.success)
        const failed = response.results.filter(r => !r.success)

        if (failed.length > 0) {
          console.error(`Failed to update ${failed.length} file records: ${JSON.stringify(failed)}`)
          failed.forEach(record => {
            record.errors?.forEach(error => toast.error(`${error.fieldLabel}: ${error}`))
            if (record.message) toast.error(record.message)
          })
        }

        return successful.length > 0 ? successful[0].data : null
      }
    } catch (error) {
      console.error("Error updating file record:", error?.response?.data?.message || error)
      return null
    }
  },

  async delete(recordId) {
    try {
      const apperClient = getApperClient()
      if (!apperClient) {
        throw new Error("ApperClient not initialized")
      }

      const params = {
        RecordIds: [parseInt(recordId)]
      }

      const response = await apperClient.deleteRecord(TABLE_NAME, params)

      if (!response.success) {
        console.error(response.message)
        toast.error(response.message)
        return false
      }

      if (response.results) {
        const successful = response.results.filter(r => r.success)
        const failed = response.results.filter(r => !r.success)

        if (failed.length > 0) {
          console.error(`Failed to delete ${failed.length} file records: ${JSON.stringify(failed)}`)
          failed.forEach(record => {
            if (record.message) toast.error(record.message)
          })
        }

        return successful.length > 0
      }

      return false
    } catch (error) {
      console.error("Error deleting file record:", error?.response?.data?.message || error)
      return false
    }
  }
}