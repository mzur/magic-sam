FROM python:3.8-slim

# Set the working directory
WORKDIR /var/www/vendor/biigle/magic-sam/microservice/

# Copy the requirements file and install dependencies
COPY samrequirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Expose the port the app runs on
EXPOSE 8080

# Command to run the app
CMD ["uvicorn", "--app-dir", "/var/www/vendor/biigle/magic-sam/microservice/", "fastmicroservice:app", "--host", "0.0.0.0", "--port", "8080"]