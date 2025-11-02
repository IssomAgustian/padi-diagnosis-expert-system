"""
AI Service Integration for diagnosis and treatment recommendations
Supports both OpenAI and Google Gemini
"""

import os
import json
import time
from typing import Dict, Any, Optional
from abc import ABC, abstractmethod
import openai
import google.generativeai as genai
from app.utils.errors import AIServiceError

class BaseAIService(ABC):
    """Abstract base class for AI services"""

    @abstractmethod
    def generate_treatment_plan(self, disease: str, symptoms: list, certainty: float) -> Dict[str, Any]:
        """Generate AI-powered treatment plan"""
        pass

    @abstractmethod
    def generate_disease_explanation(self, disease: str, symptoms: list) -> str:
        """Generate disease explanation"""
        pass


class OpenAIService(BaseAIService):
    """OpenAI GPT service implementation"""

    def __init__(self, api_key: str):
        self.client = openai.OpenAI(api_key=api_key)
        self.model = "gpt-4"  # or "gpt-3.5-turbo" for cost efficiency

    def generate_treatment_plan(self, disease: str, symptoms: list, certainty: float) -> Dict[str, Any]:
        """Generate comprehensive treatment plan using OpenAI"""
        try:
            prompt = self._build_treatment_prompt(disease, symptoms, certainty)

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert agricultural scientist specializing in rice plant diseases. Provide detailed, practical, and scientifically accurate treatment recommendations."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.3,  # Lower temperature for more consistent responses
                max_tokens=1500
            )

            content = response.choices[0].message.content
            tokens_used = response.usage.total_tokens

            # Parse and structure the response
            return {
                "treatment_plan": self._parse_treatment_response(content),
                "raw_response": content,
                "tokens_used": tokens_used,
                "model": self.model,
                "processing_time": time.time()
            }

        except Exception as e:
            raise AIServiceError(f"OpenAI API error: {str(e)}")

    def generate_disease_explanation(self, disease: str, symptoms: list) -> str:
        """Generate disease explanation using OpenAI"""
        try:
            prompt = f"""
            Explain the disease "{disease}" in rice plants based on these symptoms: {', '.join(symptoms)}.

            Provide:
            1. What causes this disease
            2. How it spreads
            3. Why these symptoms occur
            4. Prevention tips

            Keep it clear and practical for farmers.
            """

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert agricultural scientist explaining plant diseases to farmers in clear, accessible language."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.5,
                max_tokens=500
            )

            return response.choices[0].message.content

        except Exception as e:
            raise AIServiceError(f"OpenAI API error: {str(e)}")

    def _build_treatment_prompt(self, disease: str, symptoms: list, certainty: float) -> str:
        """Build the treatment prompt"""
        return f"""
        Based on a diagnosis of "{disease}" with symptoms: {', '.join(symptoms)}
        and a certainty level of {certainty:.2%}, provide a comprehensive treatment plan.

        Return a JSON response with this structure:
        {{
            "immediate_actions": ["Step-by-step immediate actions"],
            "chemical_treatment": {{
                "recommended_products": ["Product names"],
                "application_method": "How to apply",
                "dosage": "Specific dosage",
                "frequency": "Application frequency",
                "precautions": "Safety measures"
            }},
            "cultural_practices": ["Cultural control methods"],
            "monitoring": ["What to monitor after treatment"],
            "prevention": ["Preventive measures for future"],
            "timeline": "Expected recovery timeline",
            "success_rate": "Expected success rate percentage"
        }}

        Make recommendations practical for Indonesian rice farmers. Use locally available products when possible.
        """

    def _parse_treatment_response(self, content: str) -> Dict[str, Any]:
        """Parse the AI response into structured format"""
        try:
            # Try to parse as JSON first
            if content.strip().startswith('{'):
                return json.loads(content)

            # If not JSON, create structured response from text
            return {
                "immediate_actions": ["Review AI response for specific actions"],
                "chemical_treatment": {
                    "recommended_products": ["Consult local agricultural extension office"],
                    "application_method": content,
                    "dosage": "Follow product instructions",
                    "frequency": "As recommended",
                    "precautions": "Use protective equipment"
                },
                "cultural_practices": ["Improve drainage", "Balance fertilization"],
                "monitoring": ["Monitor symptom improvement"],
                "prevention": ["Use resistant varieties", "Proper field management"],
                "timeline": "2-3 weeks for improvement",
                "success_rate": "70-80% with proper treatment",
                "note": "AI response requires professional review"
            }
        except json.JSONDecodeError:
            return self._parse_text_response(content)

    def _parse_text_response(self, content: str) -> Dict[str, Any]:
        """Parse text response into structured format"""
        return {
            "immediate_actions": ["Immediate actions from AI response"],
            "chemical_treatment": {
                "recommended_products": ["Recommended products in response"],
                "application_method": content,
                "dosage": "As specified in product label",
                "frequency": "According to AI recommendation",
                "precautions": "Standard safety precautions"
            },
            "cultural_practices": ["Cultural practices mentioned in response"],
            "monitoring": ["Monitoring guidelines from response"],
            "prevention": ["Prevention measures from response"],
            "timeline": "Timeline mentioned in response",
            "success_rate": "Success rate from response",
            "note": "Response parsed from text format"
        }


class GeminiService(BaseAIService):
    """Google Gemini service implementation"""

    def __init__(self, api_key: str):
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-pro')

    def generate_treatment_plan(self, disease: str, symptoms: list, certainty: float) -> Dict[str, Any]:
        """Generate comprehensive treatment plan using Gemini"""
        try:
            prompt = self._build_treatment_prompt(disease, symptoms, certainty)

            response = self.model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.3,
                    max_output_tokens=1500,
                )
            )

            content = response.text

            return {
                "treatment_plan": self._parse_treatment_response(content),
                "raw_response": content,
                "tokens_used": len(content.split()) if content else 0,  # Approximation
                "model": "gemini-pro",
                "processing_time": time.time()
            }

        except Exception as e:
            raise AIServiceError(f"Gemini API error: {str(e)}")

    def generate_disease_explanation(self, disease: str, symptoms: list) -> str:
        """Generate disease explanation using Gemini"""
        try:
            prompt = f"""
            Explain the disease "{disease}" in rice plants based on these symptoms: {', '.join(symptoms)}.

            Provide:
            1. What causes this disease
            2. How it spreads
            3. Why these symptoms occur
            4. Prevention tips

            Keep it clear and practical for farmers.
            """

            response = self.model.generate_content(prompt)
            return response.text

        except Exception as e:
            raise AIServiceError(f"Gemini API error: {str(e)}")

    def _build_treatment_prompt(self, disease: str, symptoms: list, certainty: float) -> str:
        """Build the treatment prompt (same as OpenAI)"""
        return f"""
        Based on a diagnosis of "{disease}" with symptoms: {', '.join(symptoms)}
        and a certainty level of {certainty:.2%}, provide a comprehensive treatment plan.

        Return a JSON response with this structure:
        {{
            "immediate_actions": ["Step-by-step immediate actions"],
            "chemical_treatment": {{
                "recommended_products": ["Product names"],
                "application_method": "How to apply",
                "dosage": "Specific dosage",
                "frequency": "Application frequency",
                "precautions": "Safety measures"
            }},
            "cultural_practices": ["Cultural control methods"],
            "monitoring": ["What to monitor after treatment"],
            "prevention": ["Preventive measures for future"],
            "timeline": "Expected recovery timeline",
            "success_rate": "Expected success rate percentage"
        }}

        Make recommendations practical for Indonesian rice farmers. Use locally available products when possible.
        """

    def _parse_treatment_response(self, content: str) -> Dict[str, Any]:
        """Parse the AI response (same as OpenAI)"""
        try:
            if content.strip().startswith('{'):
                return json.loads(content)

            return {
                "immediate_actions": ["Review AI response for specific actions"],
                "chemical_treatment": {
                    "recommended_products": ["Consult local agricultural extension office"],
                    "application_method": content,
                    "dosage": "Follow product instructions",
                    "frequency": "As recommended",
                    "precautions": "Use protective equipment"
                },
                "cultural_practices": ["Improve drainage", "Balance fertilization"],
                "monitoring": ["Monitor symptom improvement"],
                "prevention": ["Use resistant varieties", "Proper field management"],
                "timeline": "2-3 weeks for improvement",
                "success_rate": "70-80% with proper treatment",
                "note": "AI response requires professional review"
            }
        except json.JSONDecodeError:
            return self._parse_text_response(content)

    def _parse_text_response(self, content: str) -> Dict[str, Any]:
        """Parse text response into structured format (same as OpenAI)"""
        return {
            "immediate_actions": ["Immediate actions from AI response"],
            "chemical_treatment": {
                "recommended_products": ["Recommended products in response"],
                "application_method": content,
                "dosage": "As specified in product label",
                "frequency": "According to AI recommendation",
                "precautions": "Standard safety precautions"
            },
            "cultural_practices": ["Cultural practices mentioned in response"],
            "monitoring": ["Monitoring guidelines from response"],
            "prevention": ["Prevention measures from response"],
            "timeline": "Timeline mentioned in response",
            "success_rate": "Success rate from response",
            "note": "Response parsed from text format"
        }


class AIServiceFactory:
    """Factory for creating AI service instances"""

    @staticmethod
    def create_service(service_type: str) -> BaseAIService:
        """Create AI service instance based on type"""
        if service_type.lower() == 'openai':
            api_key = os.getenv('OPENAI_API_KEY')
            if not api_key:
                raise AIServiceError("OpenAI API key not configured")
            return OpenAIService(api_key)

        elif service_type.lower() == 'gemini':
            api_key = os.getenv('GEMINI_API_KEY')
            if not api_key:
                raise AIServiceError("Gemini API key not configured")
            return GeminiService(api_key)

        else:
            raise AIServiceError(f"Unsupported AI service: {service_type}")


# Global AI service instance
_ai_service = None

def get_ai_service() -> BaseAIService:
    """Get configured AI service instance"""
    global _ai_service
    if _ai_service is None:
        service_type = os.getenv('AI_MODEL', 'openai')
        _ai_service = AIServiceFactory.create_service(service_type)
    return _ai_service